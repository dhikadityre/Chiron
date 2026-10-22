/**
 * Test for Ticket 04: DOM Action Bar Auto-Injection & UI Rendering
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock DOM Environment
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (cls) => this.classList._classes.add(cls),
      remove: (cls) => this.classList._classes.delete(cls),
      contains: (cls) => this.classList._classes.has(cls)
    };
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = '';
    this.innerHTML = '';
    this._eventListeners = {};
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  replaceChild(newChild, oldChild) {
    const idx = this.children.indexOf(oldChild);
    if (idx !== -1) {
      newChild.parentNode = this;
      oldChild.parentNode = null;
      this.children[idx] = newChild;
    }
  }

  addEventListener(event, handler) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(handler);
  }

  querySelectorAll(selector) {
    const results = [];
    function search(node) {
      if (selector.includes('a.gitlab-code-link')) {
        if (node.tagName === 'A' && node.classList.contains('gitlab-code-link') && !node.classList.contains('chiron-enhanced')) {
          results.push(node);
        }
      }
      for (const child of node.children) {
        search(child);
      }
    }
    search(this);
    return results;
  }
}

global.document = {
  createElement: (tag) => new MockElement(tag),
  querySelectorAll: (sel) => rootContainer.querySelectorAll(sel),
  readyState: 'complete'
};

const rootContainer = new MockElement('DIV');

// Setup mock anchor link
const mockLink = new MockElement('A');
mockLink.classList.add('gitlab-code-link');
mockLink.setAttribute('href', 'http://gitlab.samir.co.id/samir_it/samir-mobile/-/blob/learn/iOS-Arch/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift#L54-L75');
mockLink.textContent = '🦊 IDSamirMainModule.swift — application(_:didFinishLaunchingWithOptions:) learn/iOS-Arch ↗';
rootContainer.appendChild(mockLink);

// Load module
const launcher = require('./chiron-ide-launcher.js');

console.log("--- [TEST 1: initCodeActionBars Auto-Injection] ---");
launcher.initCodeActionBars(rootContainer).then(() => {
  // Check that mockLink was replaced by chiron-code-action-bar
  assert.strictEqual(rootContainer.children.length, 1);
  const bar = rootContainer.children[0];
  assert.strictEqual(bar.className, 'chiron-code-action-bar');
  assert.strictEqual(bar.children.length, 2);

  const [meta, actions] = bar.children;
  assert.strictEqual(meta.className, 'chiron-cab-meta');
  assert.strictEqual(actions.className, 'chiron-cab-actions');

  console.log("   -> Container and meta/action sections rendered properly!");

  // Check 5 IDE Action buttons
  const expectedButtons = ['cab-gitlab', 'cab-antigravity', 'cab-cursor', 'cab-vscode', 'cab-xcode'];
  assert.strictEqual(actions.children.length, 5);

  expectedButtons.forEach((btnClass, idx) => {
    const btn = actions.children[idx];
    assert(btn.className.includes(btnClass), `Button ${idx} should have class ${btnClass}`);
  });

  console.log("   -> All 5 action buttons ([GitLab] [Antigravity] [Cursor] [VS Code] [Xcode]) rendered!");
  console.log("\n🎉 ALL TESTS IN TICKET 04 PASSED!");
});
