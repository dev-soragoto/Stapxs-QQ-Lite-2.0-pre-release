import{g as v}from"./@stapxs-Av0aUqI6.js";import{c as C}from"./clipboard-Dj2tY2T2.js";var l={exports:{}};(function(d,b){var s=C,a={autoSetContainer:!1,appendToBody:!0},f={install:function(n){var i=n.version.slice(0,2)==="3."?n.config.globalProperties:n.prototype;i.$clipboardConfig=a,i.$copyText=function(r,o){return new Promise(function(p,c){var t=document.createElement("button"),e=new s(t,{text:function(){return r},action:function(){return"copy"},container:typeof o=="object"?o:document.body});e.on("success",function(u){e.destroy(),p(u)}),e.on("error",function(u){e.destroy(),c(u)}),a.appendToBody&&document.body.appendChild(t),t.click(),a.appendToBody&&document.body.removeChild(t)})},n.directive("clipboard",{bind:function(r,o,p){if(o.arg==="success")r._vClipboard_success=o.value;else if(o.arg==="error")r._vClipboard_error=o.value;else{var c=new s(r,{text:function(){return o.value},action:function(){return o.arg==="cut"?"cut":"copy"},container:a.autoSetContainer?r:void 0});c.on("success",function(t){var e=r._vClipboard_success;e&&e(t)}),c.on("error",function(t){var e=r._vClipboard_error;e&&e(t)}),r._vClipboard=c}},update:function(r,o){o.arg==="success"?r._vClipboard_success=o.value:o.arg==="error"?r._vClipboard_error=o.value:(r._vClipboard.text=function(){return o.value},r._vClipboard.action=function(){return o.arg==="cut"?"cut":"copy"})},unbind:function(r,o){r._vClipboard&&(o.arg==="success"?delete r._vClipboard_success:o.arg==="error"?delete r._vClipboard_error:(r._vClipboard.destroy(),delete r._vClipboard))}})},config:a};d.exports=f})(l);var _=l.exports;const x=v(_);export{x as V};
