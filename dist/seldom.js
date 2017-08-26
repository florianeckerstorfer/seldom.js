(function(window, factory) {
    'use strict';

    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        module.exports = factory();
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define(['exports', 'require'], function() { return factory(); });
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        window.Seldom = factory();
    }
}(window, function factory() {

var Seldom = function (domlight, clicklight, similarLight, options) {
    this.domlight = domlight || new Domlight();
    this.clicklight = clicklight || new Domlight();
    this.similarlight = similarLight || new Domlight();
    this.options = this.constructor.defaultOptions;
    for (var attrname in options) {
        this.options[attrname] = options[attrname];
    }
};

Seldom.defaultOptions = {
};

Seldom.prototype.getDeepestElementWithContent = function (elem) {
    var needle = elem.textContent,
        candidate = elem;
    for (var i = elem.childNodes.length - 1; i >= 0; i--) {
        if (elem.childNodes[i].nodeType === 1 && elem.childNodes[i].textContent === needle) {
            candidate = this.getDeepestElementWithContent(elem.childNodes[i]);
            if (candidate === null) {
                candidate = elem.childNodes[i];
            }
        }
    }

    return candidate;
};

Seldom.prototype.select = function(target, cb) {
    var overElement,
        that = this,
        elements = target.querySelectorAll('*');
    var mouseMoveHandler = function (e) {
        if (e.target != overElement) {
            that.domlight.unlight(overElement);
            overElement = e.target;
            that.domlight.highlight(overElement);
        }
    };
    var clickHandler = function (e) {
        e.preventDefault();
        e.stopPropagation();
        for (var i = elements.length - 1; i >= 0; i--) {
            elements[i].removeEventListener('mousemove', mouseMoveHandler, false);
            elements[i].removeEventListener('click', clickHandler, true);
        };
        that.domlight.unlightAll(elements);
        that.clicklight.unlightAll(elements);
        that.clicklight.highlight(e.target);
        cb(e.target);
    };

    for (var i = elements.length - 1; i >= 0; i--) {
        var element = elements[i];
        element.addEventListener('click', clickHandler, true);
        element.addEventListener('mousemove', mouseMoveHandler, false);
    };
};

Seldom.prototype.refineSelection = function(elem, cb) {
    var that = this;
    var similarElements = [];

    var positionTools = function () {
        var position = that.computePosition(elem),
            y2       = position.y2,
            x1       = position.x1;
        if (y2 > window.pageYOffset+window.innerHeight-30) {
            y2 = position.y1-35;
        }
        if (y2 < window.pageYOffset) {
            y2 += 35;
        }
        x1 = x1 <= 0 ? 0 : x1;
        y2 = y2 <= 0 ? 0 : y2;
        tools.style.left = x1+'px';
        tools.style.top  = y2+'px';
    };

    var newElement = function (newElem) {
        elem = newElem;
        positionTools();
        refreshTools();
    };

    var resetSimilarElements = function () {
        for (var i = 0; i < similarElements.length; i += 1) {
            that.similarlight.unlight(similarElements[i]);
        }
        similarElements = [];
    };

    var parentClickHandler = function () {
        resetSimilarElements();
        that.switchDomlight(that.clicklight, elem, elem.parentNode);
        newElement(elem.parentNode);
    };

    var firstChildClickHandler = function () {
        resetSimilarElements();
        if (elem.children[0]) {
            that.switchDomlight(that.clicklight, elem, elem.children[0]);
            newElement(elem.children[0]);
        }
    };

    var prevSiblingClickHandler = function () {
        resetSimilarElements();
        var sibling = that.prevRealSibling(elem);
        if (sibling) {
            that.switchDomlight(that.clicklight, elem, sibling);
            newElement(sibling);
        }
    };

    var nextSiblingClickHandler = function () {
        resetSimilarElements();
        var sibling = that.nextRealSibling(elem);
        if (sibling) {
            that.switchDomlight(that.clicklight, elem, sibling);
            newElement(sibling);
        }
    };

    var findSimilarClickHandler = function () {
      resetSimilarElements();
      var elements = that.findSimilar(elem);
      for (var j = 0; j < elements.length; j += 1) {
          if (elements[j] !== elem) {
            that.similarlight.highlight(elements[j]);
            similarElements.push(elements[j]);
          }
      }
    };

    var doneClickHandler = function () {
        document.body.removeChild(tools);
        cb(elem, similarElements);
    };

    var createTools = function () {
        var tools = document.createElement('div');
        tools.className = 'seldom__refine-selection';
        var parent = document.createElement('a');
        parent.classList.add('parent');
        parent.appendChild(document.createTextNode('Parent'));
        parent.addEventListener('click', parentClickHandler);
        var firstChild = document.createElement('a');
        firstChild.classList.add('first-child');
        firstChild.appendChild(document.createTextNode('First Child'));
        firstChild.addEventListener('click', firstChildClickHandler);
        var prevSibling = document.createElement('a');
        prevSibling.classList.add('prev-sibling');
        prevSibling.appendChild(document.createTextNode('Previous Sibling'));
        prevSibling.addEventListener('click', prevSiblingClickHandler);
        var nextSibling = document.createElement('a');
        nextSibling.classList.add('next-sibling');
        nextSibling.appendChild(document.createTextNode('Next Sibling'));
        nextSibling.addEventListener('click', nextSiblingClickHandler);
        var findSimilar = document.createElement('a');
        findSimilar.classList.add('find-similar');
        findSimilar.appendChild(document.createTextNode('Find Similar'));
        findSimilar.addEventListener('click', findSimilarClickHandler);
        var done = document.createElement('a');
        done.classList.add('done');
        done.appendChild(document.createTextNode('Done'));
        done.addEventListener('click', doneClickHandler);

        tools.appendChild(parent);
        tools.appendChild(firstChild);
        tools.appendChild(prevSibling);
        tools.appendChild(nextSibling);
        tools.appendChild(findSimilar);
        tools.appendChild(done);

        return tools;
    };

    var refreshTools = function () {
        var nextSibling = tools.querySelector('.next-sibling');
        var prevSibling = tools.querySelector('.prev-sibling');
        var firstChild = tools.querySelector('.first-child');
        var parent = tools.querySelector('.parent');
        if (that.nextRealSibling(elem) === null) {
            nextSibling.classList.add('inactive');
        } else {
            nextSibling.classList.remove('inactive');
        }
        if (that.prevRealSibling(elem) === null) {
            prevSibling.classList.add('inactive');
        } else {
            prevSibling.classList.remove('inactive');
        }
        if (elem.children[0]) {
            firstChild.classList.remove('inactive');
        } else {
            firstChild.classList.add('inactive');
        }
        if (elem.parentNode) {
            parent.classList.remove('inactive');
        } else {
            parent.classList.add('inactive');
        }
    };

    var tools = createTools();
    positionTools(tools);
    document.body.appendChild(tools);
};

Seldom.prototype.prevRealSibling = function(element) {
    var candidate = element.previousSibling;
    while (candidate && candidate.nodeType !== 1) {
        candidate = candidate.previousSibling;
    }
    if (candidate && candidate.nodeType === 1) {
        return candidate;
    }
    return null;
};

Seldom.prototype.nextRealSibling = function (element) {
    var candidate = element.nextSibling;
    while (candidate && candidate.nodeType !== 1) {
        candidate = candidate.nextSibling;
    }
    if (candidate && candidate.nodeType === 1) {
        return candidate;
    }
    return null;
};

Seldom.prototype.findSimilar = function (element) {
    var elements = [];
    if (element.className) {
        var classes = element.className.split(' ');
        for (var i = 0; i < classes.length; i += 1) {
          var matches = document.querySelectorAll(element.tagName + '.' + classes[i]);
          for (var j = 0; j < matches.length; j += 1) {
            if (!this.nodeInArray(elements, matches[j])) {
              elements.push(matches[j]);
            }
          }
        }
    }
    if (elements.length === 0) {
        var selector = '';
        var iterator = element;
        while (iterator.parentNode) {
            selector = iterator.tagName + (selector.length > 0 ? '>' + selector : '');
            iterator = iterator.parentNode;
        }
        console.log('selector', selector);
        elements = document.querySelectorAll(selector);
    }
    return elements;
};

Seldom.prototype.switchDomlight = function(domlight, element1, element2) {
    domlight.unlight(element1);
    domlight.highlight(element2);
};

Seldom.prototype.computePosition = function (element) {
    var range = document.createRange();
    range.selectNode(element);
    var rect = range.getBoundingClientRect();
    var left = window.pageXOffset+rect.left;
    var top = window.pageYOffset+rect.top;

    return {
        x1: left,
        x2: left+rect.width,
        y1: top,
        y2: top+rect.height
    };
};

Seldom.prototype.nodeInArray = function (nodes, node) {
  for (var i = 0; i < nodes.length; i += 1) {
    if (nodes[i] === node) {
      return true;
    }
  }
  return false;
};

Seldom.prototype.addEvent = function (_elem, _evtName, _fn, _useCapture) {
   if (typeof _elem.addEventListener !== 'undefined') {
        if (_evtName === 'mouseenter') {
            _elem.addEventListener('mouseover', this.mouseEnter(_fn), _useCapture);
        } else if (_evtName === 'mouseleave') {
            _elem.addEventListener('mouseout', this.mouseEnter(_fn), _useCapture);
        } else {
            _elem.addEventListener(_evtName, _fn, _useCapture);
        }
    } else if (typeof _elem.attachEvent !== 'undefined') {
        _elem.attachEvent('on' + _evtName, _fn);
    } else {
        _elem['on' + _evtName] = _fn;
    }
};

Seldom.prototype.mouseEnter = function (_fn) {
    var that = this;
    return function(_evt) {
        var relTarget = _evt.relatedTarget;
        if (this === relTarget || that.isChildOf(this, relTarget)) {
            return;
        }
        _fn.call(this, _evt);
    }
};

Seldom.prototype.isChildOf = function (_parent, _child) {
    if (_parent === _child) { return false; }
    while (_child && _child !== _parent) {
        _child = _child.parentNode;
    }
    return _child === _parent;
}

    return Seldom;
}));
