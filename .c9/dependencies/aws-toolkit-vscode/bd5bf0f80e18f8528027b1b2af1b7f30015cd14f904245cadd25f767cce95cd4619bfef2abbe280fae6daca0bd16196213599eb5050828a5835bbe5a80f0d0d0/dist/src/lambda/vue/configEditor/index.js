(()=>{var ce={322:(e,o,i)=>{"use strict";i.r(o),i.d(o,{default:()=>w});var l=i(537),d=i.n(l),m=i(645),E=i.n(m),V=E()(d());V.push([e.id,`
.preload-transition[data-v-13961f05] {
    transition: none !important;
}
.settings-title[data-v-13961f05] {
    font-size: calc(1.1 * var(--vscode-font-size)); /* TODO: make this configurable */
    font-weight: bold;
    margin: 0;
    padding: 0;
}
.sub-pane[data-v-13961f05] {
    transition: max-height 0.5s, padding 0.5s;
    padding: 1rem;
    overflow: hidden;
}
[data-v-13961f05] .sub-pane div:first-child {
    margin-top: 0;
}
.collapse-leave-from[data-v-13961f05] {
    max-height: var(--max-height);
}
.collapse-leave-active[data-v-13961f05] {
    transition: max-height 0.5s, visibility 0.5s, padding 0.5s;
    visibility: hidden;
    padding: 0 1rem;
    max-height: 0;
}
.collapse-enter-active[data-v-13961f05] {
    transition: max-height 0.5s, padding 0.5s;
    max-height: 0;
    padding: 0 1rem;
}
.collapse-enter-to[data-v-13961f05] {
    max-height: var(--max-height);
    padding: 1rem;
}
.collapse-button[data-v-13961f05] {
    display: none;
}
input[type='checkbox'] ~ label .collapse-button[data-v-13961f05] {
    display: inline-block;
    width: 24px;
    height: 24px;
    margin: -4px 0 0 0;
    padding: 0;
    font-size: 2em;
    opacity: 0.8;
    color: var(--vscode-foreground);
    transition: transform 0.5s;
    transform: rotate(180deg);
}
input[type='checkbox']:checked ~ label .collapse-button[data-v-13961f05] {
    transform: rotate(90deg);
}
.settings-panel[data-v-13961f05] {
    background: var(--vscode-menu-background);
    margin: 16px 0;
}
.panel-header[data-v-13961f05] {
    display: flex;
    align-items: center;
    width: 100%;
}
`,"",{version:3,sources:["webpack://./src/webviews/components/settingsPanel.vue"],names:[],mappings:";AA4FA;IACI,2BAA2B;AAC/B;AACA;IACI,8CAA8C,EAAE,iCAAiC;IACjF,iBAAiB;IACjB,SAAS;IACT,UAAU;AACd;AACA;IACI,yCAAyC;IACzC,aAAa;IACb,gBAAgB;AACpB;AACA;IACI,aAAa;AACjB;AACA;IACI,6BAA6B;AACjC;AACA;IACI,0DAA0D;IAC1D,kBAAkB;IAClB,eAAe;IACf,aAAa;AACjB;AACA;IACI,yCAAyC;IACzC,aAAa;IACb,eAAe;AACnB;AACA;IACI,6BAA6B;IAC7B,aAAa;AACjB;AAEA;IACI,aAAa;AACjB;AAEA;IACI,qBAAqB;IACrB,WAAW;IACX,YAAY;IACZ,kBAAkB;IAClB,UAAU;IACV,cAAc;IACd,YAAY;IACZ,+BAA+B;IAC/B,0BAA0B;IAC1B,yBAAyB;AAC7B;AAEA;IACI,wBAAwB;AAC5B;AAEA;IACI,yCAAyC;IACzC,cAAc;AAClB;AAEA;IACI,aAAa;IACb,mBAAmB;IACnB,WAAW;AACf",sourcesContent:[`/*! * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved. * SPDX-License-Identifier: Apache-2.0 */

<template>
    <div :id="id" class="settings-panel">
        <div class="header">
            <input
                v-bind:id="buttonId"
                style="display: none"
                type="checkbox"
                v-if="collapseable || startCollapsed"
                v-model="collapsed"
            />
            <label :for="buttonId" class="panel-header">
                <i class="preload-transition collapse-button icon icon-vscode-chevron-up" ref="icon"></i>
                <span class="settings-title">{{ title }}</span>
            </label>
            <p class="soft no-spacing mt-8">{{ description }}</p>
        </div>
        <transition
            @enter="updateHeight"
            @beforeLeave="updateHeight"
            :name="collapseable || startCollapsed ? 'collapse' : ''"
        >
            <div ref="subPane" v-show="!collapsed" class="sub-pane">
                <slot></slot>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { WebviewApi } from 'vscode-webview'
import { defineComponent } from 'vue'
import saveData from '../mixins/saveData'

declare const vscode: WebviewApi<{ [key: string]: VueModel }>

let count = 0

interface VueModel {
    collapsed: boolean
    buttonId: string
    lastHeight?: number
    subPane?: HTMLElement
}

/**
 * Settings panel is header + body, which may be collapseable
 */
export default defineComponent({
    name: 'settings-panel',
    props: {
        id: String,
        startCollapsed: Boolean,
        collapseable: Boolean,
        title: String,
        description: String,
    },
    data() {
        count += 1
        return {
            collapsed: this.$props.startCollapsed ?? false,
            buttonId: \`settings-panel-button-\${count}\`,
            lastHeight: undefined,
        } as VueModel
    },
    mixins: [saveData],
    methods: {
        updateHeight(el: Element & { style?: CSSStyleDeclaration }) {
            if (el.style) {
                this.lastHeight = el.scrollHeight
                el.style.setProperty('--max-height', \`\${this.lastHeight}px\`)
            }
        },
    },
    mounted() {
        this.subPane = this.$refs.subPane as HTMLElement | undefined
        this.lastHeight = this.collapsed ? this.lastHeight : this.subPane?.scrollHeight ?? this.lastHeight

        // TODO: write 'initial-style' as a directive
        // it will force a style until the first render
        // or just use Vue's transition element, but this is pretty heavy
        this.$nextTick(() => {
            setTimeout(() => {
                ;(this.$refs.icon as HTMLElement | undefined)?.classList.remove('preload-transition')
            }, 100)
        })
    },
})
<\/script>

<style scoped>
.preload-transition {
    transition: none !important;
}
.settings-title {
    font-size: calc(1.1 * var(--vscode-font-size)); /* TODO: make this configurable */
    font-weight: bold;
    margin: 0;
    padding: 0;
}
.sub-pane {
    transition: max-height 0.5s, padding 0.5s;
    padding: 1rem;
    overflow: hidden;
}
:deep(.sub-pane div:first-child) {
    margin-top: 0;
}
.collapse-leave-from {
    max-height: var(--max-height);
}
.collapse-leave-active {
    transition: max-height 0.5s, visibility 0.5s, padding 0.5s;
    visibility: hidden;
    padding: 0 1rem;
    max-height: 0;
}
.collapse-enter-active {
    transition: max-height 0.5s, padding 0.5s;
    max-height: 0;
    padding: 0 1rem;
}
.collapse-enter-to {
    max-height: var(--max-height);
    padding: 1rem;
}

.collapse-button {
    display: none;
}

input[type='checkbox'] ~ label .collapse-button {
    display: inline-block;
    width: 24px;
    height: 24px;
    margin: -4px 0 0 0;
    padding: 0;
    font-size: 2em;
    opacity: 0.8;
    color: var(--vscode-foreground);
    transition: transform 0.5s;
    transform: rotate(180deg);
}

input[type='checkbox']:checked ~ label .collapse-button {
    transform: rotate(90deg);
}

.settings-panel {
    background: var(--vscode-menu-background);
    margin: 16px 0;
}

.panel-header {
    display: flex;
    align-items: center;
    width: 100%;
}
</style>
`],sourceRoot:""}]);const w=V},672:(e,o,i)=>{"use strict";i.r(o),i.d(o,{default:()=>w});var l=i(537),d=i.n(l),m=i(645),E=i.n(m),V=E()(d());V.push([e.id,`form[data-v-3e6fca73] {
    padding: 15px;
}
.section-header[data-v-3e6fca73] {
    margin: 0px;
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-start;
}
textarea[data-v-3e6fca73] {
    max-width: 100%;
}
.config-item[data-v-3e6fca73] {
    border-bottom: 1px solid var(--vscode-menubar-selectionBackground);
    display: grid;
    grid-template-columns: 1fr 3fr;
    padding: 8px 0px;
}
.col2[data-v-3e6fca73] {
    grid-column: 2;
}
.data-view[data-v-3e6fca73] {
    display: none;
    border: dashed rgb(218, 31, 31) 1px;
    color: rgb(218, 31, 31);
}
.required[data-v-3e6fca73] {
    color: red;
}
#form-title[data-v-3e6fca73] {
    font-size: large;
    font-weight: bold;
}
.form-buttons[data-v-3e6fca73] {
    margin-left: 20px;
}
.margin-bottom-16[data-v-3e6fca73] {
    margin-bottom: 16px;
}
#target-type-selector[data-v-3e6fca73] {
    margin-bottom: 15px;
    margin-left: 8px;
}
`,"",{version:3,sources:["webpack://./src/lambda/vue/configEditor/samInvoke.css"],names:[],mappings:"AAAA;IACI,aAAa;AACjB;AACA;IACI,WAAW;IACX,mBAAmB;IACnB,aAAa;IACb,2BAA2B;AAC/B;AACA;IACI,eAAe;AACnB;AACA;IACI,kEAAkE;IAClE,aAAa;IACb,8BAA8B;IAC9B,gBAAgB;AACpB;AACA;IACI,cAAc;AAClB;AACA;IACI,aAAa;IACb,mCAAmC;IACnC,uBAAuB;AAC3B;AACA;IACI,UAAU;AACd;AACA;IACI,gBAAgB;IAChB,iBAAiB;AACrB;AACA;IACI,iBAAiB;AACrB;AACA;IACI,mBAAmB;AACvB;AACA;IACI,mBAAmB;IACnB,gBAAgB;AACpB",sourcesContent:[`form[data-v-3e6fca73] {
    padding: 15px;
}
.section-header[data-v-3e6fca73] {
    margin: 0px;
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-start;
}
textarea[data-v-3e6fca73] {
    max-width: 100%;
}
.config-item[data-v-3e6fca73] {
    border-bottom: 1px solid var(--vscode-menubar-selectionBackground);
    display: grid;
    grid-template-columns: 1fr 3fr;
    padding: 8px 0px;
}
.col2[data-v-3e6fca73] {
    grid-column: 2;
}
.data-view[data-v-3e6fca73] {
    display: none;
    border: dashed rgb(218, 31, 31) 1px;
    color: rgb(218, 31, 31);
}
.required[data-v-3e6fca73] {
    color: red;
}
#form-title[data-v-3e6fca73] {
    font-size: large;
    font-weight: bold;
}
.form-buttons[data-v-3e6fca73] {
    margin-left: 20px;
}
.margin-bottom-16[data-v-3e6fca73] {
    margin-bottom: 16px;
}
#target-type-selector[data-v-3e6fca73] {
    margin-bottom: 15px;
    margin-left: 8px;
}
`],sourceRoot:""}]);const w=V},645:e=>{"use strict";e.exports=function(o){var i=[];return i.toString=function(){return this.map(function(d){var m="",E=typeof d[5]!="undefined";return d[4]&&(m+="@supports (".concat(d[4],") {")),d[2]&&(m+="@media ".concat(d[2]," {")),E&&(m+="@layer".concat(d[5].length>0?" ".concat(d[5]):""," {")),m+=o(d),E&&(m+="}"),d[2]&&(m+="}"),d[4]&&(m+="}"),m}).join("")},i.i=function(d,m,E,V,w){typeof d=="string"&&(d=[[null,d,void 0]]);var P={};if(E)for(var O=0;O<this.length;O++){var L=this[O][0];L!=null&&(P[L]=!0)}for(var M=0;M<d.length;M++){var g=[].concat(d[M]);E&&P[g[0]]||(typeof w!="undefined"&&(typeof g[5]=="undefined"||(g[1]="@layer".concat(g[5].length>0?" ".concat(g[5]):""," {").concat(g[1],"}")),g[5]=w),m&&(g[2]&&(g[1]="@media ".concat(g[2]," {").concat(g[1],"}")),g[2]=m),V&&(g[4]?(g[1]="@supports (".concat(g[4],") {").concat(g[1],"}"),g[4]=V):g[4]="".concat(V)),i.push(g))}},i}},537:e=>{"use strict";e.exports=function(o){var i=o[1],l=o[3];if(!l)return i;if(typeof btoa=="function"){var d=btoa(unescape(encodeURIComponent(JSON.stringify(l)))),m="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(d),E="/*# ".concat(m," */"),V=l.sources.map(function(w){return"/*# sourceURL=".concat(l.sourceRoot||"").concat(w," */")});return[i].concat(V).concat([E]).join(`
`)}return[i].join(`
`)}},744:(e,o)=>{"use strict";var i;i={value:!0},o.Z=(l,d)=>{for(const[m,E]of d)l[m]=E;return l}},518:(e,o,i)=>{var l=i(322);l.__esModule&&(l=l.default),typeof l=="string"&&(l=[[e.id,l,""]]),l.locals&&(e.exports=l.locals);var d=i(346).Z,m=d("9012e55c",l,!1,{})},936:(e,o,i)=>{var l=i(672);l.__esModule&&(l=l.default),typeof l=="string"&&(l=[[e.id,l,""]]),l.locals&&(e.exports=l.locals);var d=i(346).Z,m=d("5d778c61",l,!1,{})},346:(e,o,i)=>{"use strict";i.d(o,{Z:()=>q});function l(s,h){for(var p=[],c={},r=0;r<h.length;r++){var B=h[r],y=B[0],U=B[1],T=B[2],J=B[3],S={id:s+":"+r,css:U,media:T,sourceMap:J};c[y]?c[y].parts.push(S):p.push(c[y]={id:y,parts:[S]})}return p}var d=typeof document!="undefined";if(typeof DEBUG!="undefined"&&DEBUG&&!d)throw new Error("vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.");var m={},E=d&&(document.head||document.getElementsByTagName("head")[0]),V=null,w=0,P=!1,O=function(){},L=null,M="data-vue-ssr-id",g=typeof navigator!="undefined"&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());function q(s,h,p,c){P=p,L=c||{};var r=l(s,h);return j(r),function(y){for(var U=[],T=0;T<r.length;T++){var J=r[T],S=m[J.id];S.refs--,U.push(S)}y?(r=l(s,y),j(r)):r=[];for(var T=0;T<U.length;T++){var S=U[T];if(S.refs===0){for(var $=0;$<S.parts.length;$++)S.parts[$]();delete m[S.id]}}}}function j(s){for(var h=0;h<s.length;h++){var p=s[h],c=m[p.id];if(c){c.refs++;for(var r=0;r<c.parts.length;r++)c.parts[r](p.parts[r]);for(;r<p.parts.length;r++)c.parts.push(F(p.parts[r]));c.parts.length>p.parts.length&&(c.parts.length=p.parts.length)}else{for(var B=[],r=0;r<p.parts.length;r++)B.push(F(p.parts[r]));m[p.id]={id:p.id,refs:1,parts:B}}}}function W(){var s=document.createElement("style");return s.type="text/css",E.appendChild(s),s}function F(s){var h,p,c=document.querySelector("style["+M+'~="'+s.id+'"]');if(c){if(P)return O;c.parentNode.removeChild(c)}if(g){var r=w++;c=V||(V=W()),h=z.bind(null,c,r,!1),p=z.bind(null,c,r,!0)}else c=W(),h=G.bind(null,c),p=function(){c.parentNode.removeChild(c)};return h(s),function(y){if(y){if(y.css===s.css&&y.media===s.media&&y.sourceMap===s.sourceMap)return;h(s=y)}else p()}}var X=function(){var s=[];return function(h,p){return s[h]=p,s.filter(Boolean).join(`
`)}}();function z(s,h,p,c){var r=p?"":c.css;if(s.styleSheet)s.styleSheet.cssText=X(h,r);else{var B=document.createTextNode(r),y=s.childNodes;y[h]&&s.removeChild(y[h]),y.length?s.insertBefore(B,y[h]):s.appendChild(B)}}function G(s,h){var p=h.css,c=h.media,r=h.sourceMap;if(c&&s.setAttribute("media",c),L.ssrId&&s.setAttribute(M,h.id),r&&(p+=`
/*# sourceURL=`+r.sources[0]+" */",p+=`
/*# sourceMappingURL=data:application/json;base64,`+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */"),s.styleSheet)s.styleSheet.cssText=p;else{for(;s.firstChild;)s.removeChild(s.firstChild);s.appendChild(document.createTextNode(p))}}}},Y={};function I(e){var o=Y[e];if(o!==void 0)return o.exports;var i=Y[e]={id:e,exports:{}};return ce[e](i,i.exports,I),i.exports}I.n=e=>{var o=e&&e.__esModule?()=>e.default:()=>e;return I.d(o,{a:o}),o},I.d=(e,o)=>{for(var i in o)I.o(o,i)&&!I.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:o[i]})},I.o=(e,o)=>Object.prototype.hasOwnProperty.call(e,o),I.r=e=>{typeof Symbol!="undefined"&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var H={};(()=>{"use strict";I.r(H);const e=Vue,o=t=>((0,e.pushScopeId)("data-v-3e6fca73"),t=t(),(0,e.popScopeId)(),t),i={class:"invoke-lambda-form"},l=o(()=>(0,e.createElementVNode)("h1",null,"Edit SAM Debug Configuration",-1)),d={class:"container button-container",id:"invoke-button-container"},m=(0,e.createTextVNode)(" Using this form you can create, edit, and run launch-configs of "),E=o(()=>(0,e.createElementVNode)("code",null,"type:aws-sam",-1)),V=(0,e.createTextVNode)(". When you "),w=o(()=>(0,e.createElementVNode)("strong",null,"Invoke",-1)),P=o(()=>(0,e.createElementVNode)("label",{for:"target-type-selector"},"Invoke Target Type",-1)),O=["value"],L={class:"data-view"},M={key:0,class:"target-code"},g={class:"config-item"},q=o(()=>(0,e.createElementVNode)("label",{for:"select-directory"},"Project Root",-1)),j={class:"data-view"},W={class:"config-item"},F=o(()=>(0,e.createElementVNode)("label",{for:"lambda-handler"},"Lambda Handler",-1)),X={class:"data-view"},z={class:"config-item"},G=o(()=>(0,e.createElementVNode)("label",{for:"runtime-selector"},"Runtime",-1)),s=o(()=>(0,e.createElementVNode)("option",{disabled:""},"Choose a runtime...",-1)),h=["value"],p={class:"data-view"},c={key:1,class:"target-template"},r=o(()=>(0,e.createElementVNode)("br",null,null,-1)),B={class:"config-item"},y=o(()=>(0,e.createElementVNode)("label",{for:"template-path"},"Template Path",-1)),U={class:"data-view"},T={class:"config-item"},J=o(()=>(0,e.createElementVNode)("label",{for:"logicalID"},"Resource (Logical Id)",-1)),S={class:"data-view"},$={class:"config-item"},pe=o(()=>(0,e.createElementVNode)("label",{for:"runtime-selector"},"Runtime",-1)),ue=o(()=>(0,e.createElementVNode)("option",{disabled:""},"Choose a runtime...",-1)),me=["value"],ve={class:"data-view"},he={key:2,class:"target-apigw"},ge=o(()=>(0,e.createElementVNode)("br",null,null,-1)),fe={class:"config-item"},_e=o(()=>(0,e.createElementVNode)("label",{for:"template-path"},"Template Path",-1)),Ae={class:"data-view"},be={class:"config-item"},ye=o(()=>(0,e.createElementVNode)("label",{for:"logicalID"},"Resource (Logical Id)",-1)),Ce={class:"config-item"},Ee=o(()=>(0,e.createElementVNode)("label",{for:"runtime-selector"},"Runtime",-1)),Ve=o(()=>(0,e.createElementVNode)("option",{disabled:""},"Choose a runtime...",-1)),Ne=["value"],ke={class:"data-view"},Be={class:"config-item"},we=o(()=>(0,e.createElementVNode)("label",{for:"path"},"Path",-1)),Ie={class:"config-item"},Se=o(()=>(0,e.createElementVNode)("label",{for:"http-method-selector"},"HTTP Method",-1)),Te=o(()=>(0,e.createElementVNode)("option",{disabled:""},"Choose an HTTP Method",-1)),Me=["value"],De={class:"data-view"},Pe={class:"config-item"},Oe=o(()=>(0,e.createElementVNode)("label",{for:"query-string"},"Query String",-1)),Le={class:"config-item"},Ue=o(()=>(0,e.createElementVNode)("label",{for:"headers"},"Headers",-1)),Re=["data-invalid"],Je={key:0,class:"input-validation col2"},$e={key:3},He=o(()=>(0,e.createElementVNode)("h3",null,"aws",-1)),je={class:"config-item"},We=o(()=>(0,e.createElementVNode)("label",{for:"awsConnection"},"Credentials:",-1)),Fe={class:"config-item"},ze=o(()=>(0,e.createElementVNode)("label",{for:"region"},"Region",-1)),Ke=o(()=>(0,e.createElementVNode)("h3",null,"lambda",-1)),xe={class:"config-item"},Ze=o(()=>(0,e.createElementVNode)("label",{for:""},"Environment Variables",-1)),qe=["data-invalid"],Xe={key:0,class:"input-validation col2"},Ge={class:"config-item"},Ye=o(()=>(0,e.createElementVNode)("label",{for:"memory"},"Memory (MB)",-1)),Qe={class:"config-item"},et=o(()=>(0,e.createElementVNode)("label",{for:"timeoutSec"},"Timeout (s)",-1)),tt=o(()=>(0,e.createElementVNode)("h3",null,"sam",-1)),nt={class:"config-item"},at=o(()=>(0,e.createElementVNode)("label",{for:"buildArguments"},"Build Arguments",-1)),ot={class:"config-item"},it=o(()=>(0,e.createElementVNode)("label",{for:"containerBuild"},"Container Build",-1)),st={class:"config-item"},lt=o(()=>(0,e.createElementVNode)("label",{for:"dockerNetwork"},"Docker Network",-1)),rt={class:"config-item"},dt=o(()=>(0,e.createElementVNode)("label",{for:"localArguments"},"Local Arguments",-1)),ct={class:"config-item"},pt=o(()=>(0,e.createElementVNode)("label",{for:"skipNewImageCheck"},"Skip New Image Check",-1)),ut={class:"config-item"},mt=o(()=>(0,e.createElementVNode)("label",{for:"templateParameters"},"Template - Parameters",-1)),vt=["data-invalid"],ht={key:0,class:"input-validation col2"},gt=o(()=>(0,e.createElementVNode)("h3",null,"api",-1)),ft={class:"config-item"},_t=o(()=>(0,e.createElementVNode)("label",{for:"querystring"},"Query String",-1)),At={class:"config-item"},bt=o(()=>(0,e.createElementVNode)("label",{for:"stageVariables"},"Stage Variables",-1)),yt=["data-invalid"],Ct={key:0,class:"input-validation col2"},Et={class:"config-item"},Vt=o(()=>(0,e.createElementVNode)("label",{for:"clientCerificateId"},"Client Certificate ID",-1)),Nt={class:"config-item"},kt=o(()=>(0,e.createElementVNode)("label",{for:"apiPayload"},"API Payload",-1)),Bt=["data-invalid"],wt={key:0,class:"input-validation col2"},It=o(()=>(0,e.createElementVNode)("br",null,null,-1)),St={class:"data-view"},Tt={key:0,class:"input-validation"};function Mt(t,n,u,f,b,A){const _=(0,e.resolveComponent)("settings-panel");return(0,e.openBlock)(),(0,e.createElementBlock)("form",i,[l,(0,e.createElementVNode)("div",d,[(0,e.createElementVNode)("button",{class:"",onClick:n[0]||(n[0]=(0,e.withModifiers)((...a)=>t.launch&&t.launch(...a),["prevent"]))},"Invoke"),(0,e.createElementVNode)("button",{class:"form-buttons",onClick:n[1]||(n[1]=(0,e.withModifiers)((...a)=>t.loadConfig&&t.loadConfig(...a),["prevent"]))},"Load Existing Config"),(0,e.createElementVNode)("button",{class:"form-buttons",onClick:n[2]||(n[2]=(0,e.withModifiers)((...a)=>t.save&&t.save(...a),["prevent"]))},"Save")]),(0,e.createElementVNode)("p",null,[(0,e.createElementVNode)("em",null,[m,E,V,w,(0,e.createTextVNode)(" the launch config, "+(0,e.toDisplayString)(t.company)+" Toolkit calls SAM CLI and attaches the debugger to the code running in a local Docker container. ",1)])]),(0,e.createVNode)(_,{id:"config-panel",title:"Configuration",description:""},{default:(0,e.withCtx)(()=>[P,(0,e.withDirectives)((0,e.createElementVNode)("select",{name:"target-types",id:"target-type-selector","onUpdate:modelValue":n[3]||(n[3]=a=>t.launchConfig.invokeTarget.target=a)},[((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(t.targetTypes,(a,v)=>((0,e.openBlock)(),(0,e.createElementBlock)("option",{value:a.value,key:v},(0,e.toDisplayString)(a.name),9,O))),128))],512),[[e.vModelSelect,t.launchConfig.invokeTarget.target]]),(0,e.createElementVNode)("span",L,(0,e.toDisplayString)(t.launchConfig.invokeTarget.target),1),t.launchConfig.invokeTarget.target==="code"?((0,e.openBlock)(),(0,e.createElementBlock)("div",M,[(0,e.createElementVNode)("div",g,[q,(0,e.withDirectives)((0,e.createElementVNode)("input",{id:"select-directory",type:"text","onUpdate:modelValue":n[4]||(n[4]=a=>t.launchConfig.invokeTarget.projectRoot=a),placeholder:"Enter a directory"},null,512),[[e.vModelText,t.launchConfig.invokeTarget.projectRoot]]),(0,e.createElementVNode)("span",j,"the selected directory: "+(0,e.toDisplayString)(t.launchConfig.invokeTarget.projectRoot),1)]),(0,e.createElementVNode)("div",W,[F,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text",placeholder:"Enter the lambda handler",name:"lambda-handler",id:"lambda-handler","onUpdate:modelValue":n[5]||(n[5]=a=>t.launchConfig.invokeTarget.lambdaHandler=a)},null,512),[[e.vModelText,t.launchConfig.invokeTarget.lambdaHandler]]),(0,e.createElementVNode)("span",X,"lamda handler :"+(0,e.toDisplayString)(t.launchConfig.invokeTarget.lambdaHandler),1)]),(0,e.createElementVNode)("div",z,[G,(0,e.withDirectives)((0,e.createElementVNode)("select",{name:"runtimeType","onUpdate:modelValue":n[6]||(n[6]=a=>t.launchConfig.lambda.runtime=a)},[s,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(t.runtimes,(a,v)=>((0,e.openBlock)(),(0,e.createElementBlock)("option",{value:a,key:v},(0,e.toDisplayString)(a),9,h))),128))],512),[[e.vModelSelect,t.launchConfig.lambda.runtime]]),(0,e.createElementVNode)("span",p,"runtime in data: "+(0,e.toDisplayString)(t.launchConfig.lambda.runtime),1)])])):t.launchConfig.invokeTarget.target==="template"?((0,e.openBlock)(),(0,e.createElementBlock)("div",c,[(0,e.createElementVNode)("button",{class:"margin-bottom-16",onClick:n[7]||(n[7]=(0,e.withModifiers)((...a)=>t.loadResource&&t.loadResource(...a),["prevent"]))},"Load Resource"),r,(0,e.createElementVNode)("div",B,[y,(0,e.withDirectives)((0,e.createElementVNode)("input",{id:"template-path-button",type:"text","onUpdate:modelValue":n[8]||(n[8]=a=>t.launchConfig.invokeTarget.templatePath=a),placeholder:"Enter the template path..."},null,512),[[e.vModelText,t.launchConfig.invokeTarget.templatePath]]),(0,e.createElementVNode)("span",U,"Template path from data: "+(0,e.toDisplayString)(t.launchConfig.invokeTarget.templatePath),1)]),(0,e.createElementVNode)("div",T,[J,(0,e.withDirectives)((0,e.createElementVNode)("input",{name:"template-logical-id",id:"template-logical-id",type:"text",placeholder:"Enter a resource","onUpdate:modelValue":n[9]||(n[9]=a=>t.launchConfig.invokeTarget.logicalId=a)},null,512),[[e.vModelText,t.launchConfig.invokeTarget.logicalId]]),(0,e.createElementVNode)("span",S," Logical Id from data: "+(0,e.toDisplayString)(t.launchConfig.invokeTarget.logicalId),1)]),(0,e.createElementVNode)("div",$,[pe,(0,e.withDirectives)((0,e.createElementVNode)("select",{name:"runtimeType","onUpdate:modelValue":n[10]||(n[10]=a=>t.launchConfig.lambda.runtime=a)},[ue,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(t.runtimes,(a,v)=>((0,e.openBlock)(),(0,e.createElementBlock)("option",{value:a,key:v},(0,e.toDisplayString)(a),9,me))),128))],512),[[e.vModelSelect,t.launchConfig.lambda.runtime]]),(0,e.createElementVNode)("span",ve,"runtime in data: "+(0,e.toDisplayString)(t.launchConfig.lambda.runtime),1)])])):t.launchConfig.invokeTarget.target==="api"?((0,e.openBlock)(),(0,e.createElementBlock)("div",he,[(0,e.createElementVNode)("button",{onClick:n[11]||(n[11]=(0,e.withModifiers)((...a)=>t.loadResource&&t.loadResource(...a),["prevent"]))},"Load Resource"),ge,(0,e.createElementVNode)("div",fe,[_e,(0,e.withDirectives)((0,e.createElementVNode)("input",{id:"template-path-button",type:"text","onUpdate:modelValue":n[12]||(n[12]=a=>t.launchConfig.invokeTarget.templatePath=a),placeholder:"Enter the template path..."},null,512),[[e.vModelText,t.launchConfig.invokeTarget.templatePath]]),(0,e.createElementVNode)("span",Ae,"Template path from data: "+(0,e.toDisplayString)(t.launchConfig.invokeTarget.templatePath),1)]),(0,e.createElementVNode)("div",be,[ye,(0,e.withDirectives)((0,e.createElementVNode)("input",{name:"template-logical-id",id:"template-logical-id",type:"text",placeholder:"Enter a resource","onUpdate:modelValue":n[13]||(n[13]=a=>t.launchConfig.invokeTarget.logicalId=a)},null,512),[[e.vModelText,t.launchConfig.invokeTarget.logicalId]])]),(0,e.createElementVNode)("div",Ce,[Ee,(0,e.withDirectives)((0,e.createElementVNode)("select",{name:"runtimeType","onUpdate:modelValue":n[14]||(n[14]=a=>t.launchConfig.lambda.runtime=a)},[Ve,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(t.runtimes,(a,v)=>((0,e.openBlock)(),(0,e.createElementBlock)("option",{value:a,key:v},(0,e.toDisplayString)(a),9,Ne))),128))],512),[[e.vModelSelect,t.launchConfig.lambda.runtime]]),(0,e.createElementVNode)("span",ke,"runtime in data: "+(0,e.toDisplayString)(t.launchConfig.lambda.runtime),1)]),(0,e.createElementVNode)("div",Be,[we,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[15]||(n[15]=a=>t.launchConfig.api.path=a)},null,512),[[e.vModelText,t.launchConfig.api.path]])]),(0,e.createElementVNode)("div",Ie,[Se,(0,e.withDirectives)((0,e.createElementVNode)("select",{name:"http-method","onUpdate:modelValue":n[16]||(n[16]=a=>t.launchConfig.api.httpMethod=a)},[Te,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(t.httpMethods,(a,v)=>((0,e.openBlock)(),(0,e.createElementBlock)("option",{value:a.toLowerCase(),key:v},(0,e.toDisplayString)(a),9,Me))),128))],512),[[e.vModelSelect,t.launchConfig.api.httpMethod]]),(0,e.createElementVNode)("span",De,(0,e.toDisplayString)(t.launchConfig.api.httpMethod),1)]),(0,e.createElementVNode)("div",Pe,[Oe,(0,e.withDirectives)((0,e.createElementVNode)("input",{name:"query-string",id:"query-string",type:"text",cols:"15",rows:"2",placeholder:"Enter a query","onUpdate:modelValue":n[17]||(n[17]=a=>t.launchConfig.api.querystring=a)},null,512),[[e.vModelText,t.launchConfig.api.querystring]])]),(0,e.createElementVNode)("div",Le,[Ue,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[18]||(n[18]=a=>t.headers.value=a),placeholder:"Enter as valid JSON","data-invalid":!!t.headers.errorMsg},null,8,Re),[[e.vModelText,t.headers.value]]),t.headers.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",Je," Error parsing JSON: "+(0,e.toDisplayString)(t.headers.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)])])):((0,e.openBlock)(),(0,e.createElementBlock)("div",$e,"Select an Invoke Target"))]),_:1}),(0,e.createVNode)(_,{id:"more-fields-panel",title:"Additional Fields",description:"","start-collapsed":""},{default:(0,e.withCtx)(()=>[He,(0,e.createElementVNode)("div",je,[We,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[19]||(n[19]=a=>t.launchConfig.aws.credentials=a)},null,512),[[e.vModelText,t.launchConfig.aws.credentials]])]),(0,e.createElementVNode)("div",Fe,[ze,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[20]||(n[20]=a=>t.launchConfig.aws.region=a)},null,512),[[e.vModelText,t.launchConfig.aws.region]])]),Ke,(0,e.createElementVNode)("div",xe,[Ze,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text",placeholder:"Enter as valid JSON","onUpdate:modelValue":n[21]||(n[21]=a=>t.environmentVariables.value=a),"data-invalid":!!t.environmentVariables.errorMsg},null,8,qe),[[e.vModelText,t.environmentVariables.value]]),t.environmentVariables.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",Xe," Error parsing JSON: "+(0,e.toDisplayString)(t.environmentVariables.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)]),(0,e.createElementVNode)("div",Ge,[Ye,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"number","onUpdate:modelValue":n[22]||(n[22]=a=>t.launchConfig.lambda.memoryMb=a)},null,512),[[e.vModelText,t.launchConfig.lambda.memoryMb,void 0,{number:!0}]])]),(0,e.createElementVNode)("div",Qe,[et,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"number","onUpdate:modelValue":n[23]||(n[23]=a=>t.launchConfig.lambda.timeoutSec=a)},null,512),[[e.vModelText,t.launchConfig.lambda.timeoutSec,void 0,{number:!0}]])]),(0,e.createCommentVNode)(` <div class="config-item">
                <label for="pathMappings">Path Mappings</label>
                <input type="text" v-model="launchConfig.lambda.pathMappings" >
            </div> `),tt,(0,e.createElementVNode)("div",nt,[at,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[24]||(n[24]=a=>t.launchConfig.sam.buildArguments=a),placeholder:"Enter as a comma separated list"},null,512),[[e.vModelText,t.launchConfig.sam.buildArguments]])]),(0,e.createElementVNode)("div",ot,[it,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"checkbox",name:"containerBuild",id:"containerBuild","onUpdate:modelValue":n[25]||(n[25]=a=>t.containerBuild=a)},null,512),[[e.vModelCheckbox,t.containerBuild]])]),(0,e.createElementVNode)("div",st,[lt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[26]||(n[26]=a=>t.launchConfig.sam.dockerNetwork=a)},null,512),[[e.vModelText,t.launchConfig.sam.dockerNetwork]])]),(0,e.createElementVNode)("div",rt,[dt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[27]||(n[27]=a=>t.launchConfig.sam.localArguments=a),placeholder:"Enter as a comma separated list"},null,512),[[e.vModelText,t.launchConfig.sam.localArguments]])]),(0,e.createElementVNode)("div",ct,[pt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"checkbox",name:"skipNewImageCheck",id:"skipNewImageCheck","onUpdate:modelValue":n[28]||(n[28]=a=>t.skipNewImageCheck=a)},null,512),[[e.vModelCheckbox,t.skipNewImageCheck]])]),(0,e.createElementVNode)("div",ut,[mt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[29]||(n[29]=a=>t.parameters.value=a),"data-invalid":!!t.parameters.errorMsg},null,8,vt),[[e.vModelText,t.parameters.value]]),t.parameters.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",ht," Error parsing JSON: "+(0,e.toDisplayString)(t.parameters.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)]),gt,(0,e.createElementVNode)("div",ft,[_t,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[30]||(n[30]=a=>t.launchConfig.api.querystring=a)},null,512),[[e.vModelText,t.launchConfig.api.querystring]])]),(0,e.createElementVNode)("div",At,[bt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[31]||(n[31]=a=>t.stageVariables.value=a),"data-invalid":!!t.stageVariables.errorMsg,placeholder:"Enter as valid JSON"},null,8,yt),[[e.vModelText,t.stageVariables.value]]),t.stageVariables.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",Ct," Error parsing JSON: "+(0,e.toDisplayString)(t.stageVariables.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)]),(0,e.createElementVNode)("div",Et,[Vt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[32]||(n[32]=a=>t.launchConfig.api.clientCertificateId=a)},null,512),[[e.vModelText,t.launchConfig.api.clientCertificateId]])]),(0,e.createElementVNode)("div",Nt,[kt,(0,e.withDirectives)((0,e.createElementVNode)("input",{type:"text","onUpdate:modelValue":n[33]||(n[33]=a=>t.apiPayload.value=a),placeholder:"Enter as valid JSON","data-invalid":!!t.apiPayload.errorMsg},null,8,Bt),[[e.vModelText,t.apiPayload.value]]),t.apiPayload.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",wt," Error parsing JSON: "+(0,e.toDisplayString)(t.apiPayload.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)])]),_:1}),(0,e.createVNode)(_,{id:"payload-panel",title:"Payload",description:"","start-collapsed":""},{default:(0,e.withCtx)(()=>[(0,e.createElementVNode)("button",{class:"margin-bottom-16",onClick:n[34]||(n[34]=(0,e.withModifiers)((...a)=>t.loadPayload&&t.loadPayload(...a),["prevent"]))},"Load Sample Payload"),It,(0,e.withDirectives)((0,e.createElementVNode)("textarea",{name:"lambda-payload",id:"lambda-payload",cols:"60",rows:"5","onUpdate:modelValue":n[35]||(n[35]=a=>t.payload.value=a)},null,512),[[e.vModelText,t.payload.value]]),(0,e.createElementVNode)("span",St,"payload from data: "+(0,e.toDisplayString)(t.payload),1),t.payload.errorMsg?((0,e.openBlock)(),(0,e.createElementBlock)("div",Tt,"Error parsing JSON: "+(0,e.toDisplayString)(t.payload.errorMsg),1)):(0,e.createCommentVNode)("v-if",!0)]),_:1})])}const xt=t=>(_pushScopeId("data-v-13961f05"),t=t(),_popScopeId(),t),Dt=["id"],Pt={class:"header"},Ot=["id"],Lt=["for"],Ut={class:"preload-transition collapse-button icon icon-vscode-chevron-up",ref:"icon"},Rt={class:"settings-title"},Jt={class:"soft no-spacing mt-8"},$t={ref:"subPane",class:"sub-pane"};function Ht(t,n,u,f,b,A){return(0,e.openBlock)(),(0,e.createElementBlock)("div",{id:t.id,class:"settings-panel"},[(0,e.createElementVNode)("div",Pt,[t.collapseable||t.startCollapsed?(0,e.withDirectives)(((0,e.openBlock)(),(0,e.createElementBlock)("input",{key:0,id:t.buttonId,style:{display:"none"},type:"checkbox","onUpdate:modelValue":n[0]||(n[0]=_=>t.collapsed=_)},null,8,Ot)),[[e.vModelCheckbox,t.collapsed]]):(0,e.createCommentVNode)("v-if",!0),(0,e.createElementVNode)("label",{for:t.buttonId,class:"panel-header"},[(0,e.createElementVNode)("i",Ut,null,512),(0,e.createElementVNode)("span",Rt,(0,e.toDisplayString)(t.title),1)],8,Lt),(0,e.createElementVNode)("p",Jt,(0,e.toDisplayString)(t.description),1)]),(0,e.createVNode)(e.Transition,{onEnter:t.updateHeight,onBeforeLeave:t.updateHeight,name:t.collapseable||t.startCollapsed?"collapse":""},{default:(0,e.withCtx)(()=>[(0,e.withDirectives)((0,e.createElementVNode)("div",$t,[(0,e.renderSlot)(t.$slots,"default",{},void 0,!0)],512),[[e.vShow,!t.collapsed]])]),_:3},8,["onEnter","onBeforeLeave","name"])],8,Dt)}/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */const K=new Set;window.addEventListener("remount",()=>K.clear());const te={created(){var t,n,u,f,b;if(this.$data===void 0)return;const A=(t=vscode.getState())!=null?t:{};this.$options._count=((n=this.$options._count)!=null?n:0)+1;const _=(f=this.id)!=null?f:`${(u=this.name)!=null?u:`DEFAULT-${K.size}`}-${this.$options._count}`;if(this.$options._unid=_,K.has(_)){console.warn(`Component "${_}" already exists. State-saving functionality will be disabled.`);return}K.add(_);const a=(b=A[_])!=null?b:{};Object.keys(this.$data).forEach(v=>{var N;this.$data[v]=(N=a[v])!=null?N:this.$data[v]}),Object.keys(this.$data).forEach(v=>{this.$watch(v,N=>{var C,k;const R=(C=vscode.getState())!=null?C:{},Z=Object.assign((k=R[_])!=null?k:{},{[v]:N!==void 0?JSON.parse(JSON.stringify(N)):void 0});vscode.setState(Object.assign(R,{[_]:Z}))},{deep:!0})})}};let ne=0;const jt=(0,e.defineComponent)({name:"settings-panel",props:{id:String,startCollapsed:Boolean,collapseable:Boolean,title:String,description:String},data(){var t;return ne+=1,{collapsed:(t=this.$props.startCollapsed)!=null?t:!1,buttonId:`settings-panel-button-${ne}`,lastHeight:void 0}},mixins:[te],methods:{updateHeight(t){t.style&&(this.lastHeight=t.scrollHeight,t.style.setProperty("--max-height",`${this.lastHeight}px`))}},mounted(){var t,n;this.subPane=this.$refs.subPane,this.lastHeight=this.collapsed?this.lastHeight:(n=(t=this.subPane)==null?void 0:t.scrollHeight)!=null?n:this.lastHeight,this.$nextTick(()=>{setTimeout(()=>{var u;(u=this.$refs.icon)==null||u.classList.remove("preload-transition")},100)})}});var qt=I(518),ae=I(744);const Wt=(0,ae.Z)(jt,[["render",Ht],["__scopeId","data-v-13961f05"]]);/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */class x{static registerGlobalCommands(){const n=new Event("remount");window.addEventListener("message",u=>{const{command:f}=u.data;f==="$clear"&&(vscode.setState({}),this.messageListeners.forEach(b=>this.removeListener(b)),window.dispatchEvent(n))})}static addListener(n){this.messageListeners.add(n),window.addEventListener("message",n)}static removeListener(n){this.messageListeners.delete(n),window.removeEventListener("message",n)}static sendRequest(n,u,f){const b=JSON.parse(JSON.stringify(f)),A=new Promise((_,a)=>{const v=C=>{const k=C.data;if(n===k.id)if(this.removeListener(v),window.clearTimeout(N),k.error===!0){const R=JSON.parse(k.data);a(new Error(R.message))}else k.event?(typeof f[0]!="function"&&a(new Error(`Expected frontend event handler to be a function: ${u}`)),_(this.registerEventHandler(u,f[0]))):_(k.data)},N=setTimeout(()=>{this.removeListener(v),a(new Error(`Timed out while waiting for response: id: ${n}, command: ${u}`))},3e5);this.addListener(v)});return vscode.postMessage({id:n,command:u,data:b}),A}static registerEventHandler(n,u){const f=b=>{const A=b.data;if(A.command===n){if(!A.event)throw new Error(`Expected backend handler to be an event emitter: ${n}`);u(A.data)}};return this.addListener(f),{dispose:()=>this.removeListener(f)}}static create(){return this.initialized||(this.initialized=!0,this.registerGlobalCommands()),new Proxy({},{set:()=>{throw new TypeError("Cannot set property to webview client")},get:(n,u)=>{var f;if(typeof u!="string"){console.warn(`Tried to index webview client with non-string property: ${String(u)}`);return}if(u==="init"){const A=(f=vscode.getState())!=null?f:{};if(A.__once)return()=>Promise.resolve();vscode.setState(Object.assign(A,{__once:!0}))}const b=(this.counter++).toString();return(...A)=>this.sendRequest(b,u,A)}})}}x.counter=0,x.initialized=!1,x.messageListeners=new Set;/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */const D=x.create();function oe(t){var n,u,f,b,A,_,a,v,N,C,k;return{type:"aws-sam",request:"direct-invoke",name:"",aws:{credentials:"",region:"",...t!=null&&t.aws?t.aws:{}},invokeTarget:{target:"template",templatePath:"",logicalId:"",lambdaHandler:"",projectRoot:"",...t==null?void 0:t.invokeTarget},lambda:{runtime:(n=t==null?void 0:t.lambda)==null?void 0:n.runtime,memoryMb:void 0,timeoutSec:void 0,environmentVariables:{},...t==null?void 0:t.lambda,payload:{json:(f=(u=t==null?void 0:t.lambda)==null?void 0:u.payload)!=null&&f.json?t.lambda.payload.json:{},path:(A=(b=t==null?void 0:t.lambda)==null?void 0:b.payload)!=null&&A.path?t.lambda.payload.path:""}},sam:{buildArguments:void 0,containerBuild:!1,dockerNetwork:"",localArguments:void 0,skipNewImageCheck:!1,...t!=null&&t.sam?t.sam:{},template:{parameters:(a=(_=t==null?void 0:t.sam)==null?void 0:_.template)!=null&&a.parameters?t.sam.template.parameters:{}}},api:{path:"",httpMethod:"get",clientCertificateId:"",querystring:"",headers:{},stageVariables:{},...t!=null&&t.api?t.api:{},payload:{json:(N=(v=t==null?void 0:t.api)==null?void 0:v.payload)!=null&&N.json?t.api.payload.json:{},path:(k=(C=t==null?void 0:t.api)==null?void 0:C.payload)!=null&&k.path?t.api.payload.path:""}}}}function ie(){return{containerBuild:!1,skipNewImageCheck:!1,launchConfig:oe(),payload:{value:"",errorMsg:""},apiPayload:{value:"",errorMsg:""},environmentVariables:{value:"",errorMsg:""},parameters:{value:"",errorMsg:""},headers:{value:"",errorMsg:""},stageVariables:{value:"",errorMsg:""}}}const Ft=(0,e.defineComponent)({name:"sam-invoke",components:{settingsPanel:Wt},created(){D.init().then(t=>this.parseConfig(t)),D.getRuntimes().then(t=>{this.runtimes=t}),D.getCompanyName().then(t=>{this.company=t})},mixins:[te],data(){return{...ie(),msg:"Hello",company:"",targetTypes:[{name:"Code",value:"code"},{name:"Template",value:"template"},{name:"API Gateway (Template)",value:"api"}],runtimes:[],httpMethods:["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"]}},methods:{resetJsonErrors(){this.payload.errorMsg="",this.environmentVariables.errorMsg="",this.headers.errorMsg="",this.stageVariables.errorMsg=""},launch(){const t=this.formatConfig();t&&D.invokeLaunchConfig(t)},save(){const t=this.formatConfig();t&&D.saveLaunchConfig(t)},loadConfig(){D.loadSamLaunchConfig().then(t=>this.parseConfig(t))},parseConfig(t){var n,u,f,b,A,_,a,v,N,C,k,R,Z,re,de;if(!t)return;const Kt=this.company;this.clearForm(),this.launchConfig=oe(t),(n=t.lambda)!=null&&n.payload&&(this.payload.value=JSON.stringify(t.lambda.payload.json,void 0,4)),(u=t.lambda)!=null&&u.environmentVariables&&(this.environmentVariables.value=JSON.stringify((f=t.lambda)==null?void 0:f.environmentVariables)),(A=(b=t.sam)==null?void 0:b.template)!=null&&A.parameters&&(this.parameters.value=JSON.stringify((a=(_=t.sam)==null?void 0:_.template)==null?void 0:a.parameters)),(v=t.api)!=null&&v.headers&&(this.headers.value=JSON.stringify((N=t.api)==null?void 0:N.headers)),(C=t.api)!=null&&C.stageVariables&&(this.stageVariables.value=JSON.stringify((k=t.api)==null?void 0:k.stageVariables)),this.containerBuild=(Z=(R=t.sam)==null?void 0:R.containerBuild)!=null?Z:!1,this.skipNewImageCheck=(de=(re=t.sam)==null?void 0:re.skipNewImageCheck)!=null?de:!1,this.msg=`Loaded config ${t}`,this.company=Kt},loadPayload(){this.resetJsonErrors(),D.getSamplePayload().then(t=>{!t||(this.payload.value=JSON.stringify(JSON.parse(t),void 0,4))})},loadResource(){this.resetJsonErrors(),D.getTemplate().then(t=>{!t||(this.launchConfig.invokeTarget.target="template",this.launchConfig.invokeTarget.logicalId=t.logicalId,this.launchConfig.invokeTarget.templatePath=t.template)})},formatFieldToStringArray(t){if(!t)return;const n=/\s*,\s*/g;return t.trim().split(n)},formatStringtoJSON(t){if(t.errorMsg="",t.value)try{return JSON.parse(t.value)}catch(n){throw t.errorMsg=n.message,n}},formatConfig(){var t,n,u,f;this.resetJsonErrors();let b,A,_,a,v,N;try{b=this.formatStringtoJSON(this.payload),A=this.formatStringtoJSON(this.environmentVariables),_=this.formatStringtoJSON(this.headers),a=this.formatStringtoJSON(this.stageVariables),v=this.formatStringtoJSON(this.parameters),N=this.formatStringtoJSON(this.apiPayload)}catch(k){return}const C=JSON.parse(JSON.stringify(this.launchConfig));return{...C,lambda:{...C.lambda,payload:{...C.payload,json:b},environmentVariables:A},sam:{...C.sam,buildArguments:this.formatFieldToStringArray((n=(t=C.sam)==null?void 0:t.buildArguments)==null?void 0:n.toString()),localArguments:this.formatFieldToStringArray((f=(u=C.sam)==null?void 0:u.localArguments)==null?void 0:f.toString()),containerBuild:this.containerBuild,skipNewImageCheck:this.skipNewImageCheck,template:{parameters:v}},api:C.api?{...C.api,headers:_,stageVariables:a,payload:{json:N}}:void 0}},clearForm(){const t=ie();Object.keys(t).forEach(n=>this.$data[n]=t[n])}}});var Gt=I(936);const zt=(0,ae.Z)(Ft,[["render",Mt],["__scopeId","data-v-3e6fca73"]]);/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */const se=()=>(0,e.createApp)(zt),le=se();le.mount("#vue-app"),window.addEventListener("remount",()=>{le.unmount(),se().mount("#vue-app")})})();var Q=this;for(var ee in H)Q[ee]=H[ee];H.__esModule&&Object.defineProperty(Q,"__esModule",{value:!0})})();

//# sourceMappingURL=index.js.map