(()=>{var Q={432:(e,n,r)=>{"use strict";r.r(n),r.d(n,{default:()=>S});var c=r(537),s=r.n(c),l=r(645),C=r.n(l),w=C()(s());w.push([e.id,`
/* Styling specific this component can be placed here */
.container[data-v-1f6bf60a] {
    display: flex;
    flex-direction: row;
    column-gap: 2em;
    justify-content: flex-end;
    padding-bottom: 1em;
    background-color: transparent;
}
.block[data-v-1f6bf60a] {
    background-color: #464e57;
}
.block[data-v-1f6bf60a]:hover {
    background-color: transparent;
}
#event-list[data-v-1f6bf60a] {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
.binding-style[data-v-1f6bf60a] {
    font-weight: 700;
    color: #1e90ff;
}
#cancel[data-v-1f6bf60a],
#accept[data-v-1f6bf60a] {
    display: block;
}
.button-right[data-v-1f6bf60a] {
    float: right;
}
.codewhisperer-preview-terms[data-v-1f6bf60a] {
    text-align: center;
    font-weight: bold;
    text-decoration-line: underline;
}
.table-bordered[data-v-1f6bf60a] {
    border-collapse: collapse;
}
table[data-v-1f6bf60a],
th[data-v-1f6bf60a],
td[data-v-1f6bf60a] {
    border: 1px solid gray;
}
`,"",{version:3,sources:["webpack://./src/codewhisperer/vue/root.vue"],names:[],mappings:";AAsMA,uDAAuD;AACvD;IACI,aAAa;IACb,mBAAmB;IACnB,eAAe;IACf,yBAAyB;IACzB,mBAAmB;IACnB,6BAA6B;AACjC;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,6BAA6B;AACjC;AACA;IACI,aAAa;IACb,8BAA8B;AAClC;AACA;IACI,gBAAgB;IAChB,cAAc;AAClB;AACA;;IAEI,cAAc;AAClB;AAEA;IACI,YAAY;AAChB;AACA;IACI,kBAAkB;IAClB,iBAAiB;IACjB,+BAA+B;AACnC;AACA;IACI,yBAAyB;AAC7B;AACA;;;IAGI,sBAAsB;AAC1B",sourcesContent:[`<template id="codewhispererTOSTemplate">
    <div>
        <h1 class="codewhisperer-preview-terms">Amazon CodeWhisperer Terms of Service</h1>
        <div style="width: 100%">
            <p>
                The Amazon CodeWhisperer service is provided as a 'Beta Service' and an 'AI Service' as defined in the
                AWS Service Terms. Usage of the CodeWhisperer Beta Service is governed by your Agreement with AWS and
                the
                <a href="https://aws.amazon.com/service-terms/"> AWS Service Terms</a>, as supplemented by these
                additional terms, which are made part of Section 2 ('Betas and Previews') of the Service Terms. Any term
                undefined in these CodeWhisperer preview terms will have the meaning assigned to it in the Agreement and
                Service Terms.
            </p>
            <div>
                Before using the CodeWhisperer Beta Service, please review the Betas and Previews terms found
                <a href="https://aws.amazon.com/service-terms/"> here</a>. The CodeWhisperer Beta Service uses certain
                information to provide and/or improve the service, including: <br /><br />
                <div>
                    <table class="table-bordered">
                        <tr>
                            <th>Data Type</th>
                            <th>Examples</th>
                        </tr>
                        <tr>
                            <td>Contextual information</td>
                            <td>file content, filename, programming language, cursor location, active line number</td>
                        </tr>
                        <tr>
                            <td>Feedback</td>
                            <td>
                                acceptance or rejection of recommendations, modifications to recommendations, user
                                settings
                            </td>
                        </tr>
                        <tr>
                            <td>Telemetry metrics</td>
                            <td>latency, errors, CodeWhisperer API interactions</td>
                        </tr>
                        <tr>
                            <td>User environment information</td>
                            <td>which IDE is being used, OS information, transfer protocols</td>
                        </tr>
                    </table>
                </div>
            </div>
            <br />
            <div>
                <div v-if="isCloud9">
                    <p>
                        The CodeWhisperer preview period will help us conduct key testing and research in order to
                        improve CodeWhisperer and prepare it for general availability. For Your Content processed by the
                        CodeWhisperer Beta Service (the \u201CCodeWhisperer Content\u201D), you agree and instruct that (a) we may
                        use and store the CodeWhisperer Content to maintain and provide the CodeWhisperer services
                        (including development and improvement of the CodeWhisperer services and underlying technology);
                        (b) we may use and store the CodeWhisperer Content that is not personal data to develop and
                        improve AWS and affiliate machine-learning and artificial-intelligence technologies; and (c)
                        solely in connection with the development and improvement described in clauses (a) and (b), we
                        may store the Content in an AWS region outside of the AWS region where you are using
                        CodeWhisperer. If you have participated in the CodeWhisperer preview and would like Your Content
                        deleted, please contact us at
                        <a href="mailto:codewhisperer@amazon.com"> this link</a>. As part of the CodeWhisperer preview,
                        we may offer you the option to toggle CodeWhisperer Content sharing on or off through the Beta
                        Service. If you decline to share CodeWhisperer Content through the Beta Service for an account
                        or set of credentials, we will refrain from collecting the applicable CodeWhisperer Content for
                        this purpose and will delete any of that CodeWhisperer Content that we have collected for this
                        purpose. This paragraph does not apply to Your Content that is processed through CodeWhisperer
                        via Lambda or Cloud9 interfaces.
                    </p>
                    <p>
                        In addition, we may offer you the option through the Beta Service to limit the collection of
                        metadata, feedback, or other usage metrics which are not CodeWhisperer Content for service
                        improvement (for example, whether a recommendation was accepted or rejected, but not the content
                        of that recommendation).
                    </p>
                </div>
                <div v-else>
                    The CodeWhisperer preview period will help us conduct key testing and research in order to improve
                    CodeWhisperer and prepare it for general availability. For Your Content processed by the
                    CodeWhisperer Beta Service (the \u201CCodeWhisperer Content\u201D), you agree and instruct that (a) we may use
                    and store the CodeWhisperer Content to maintain and provide the CodeWhisperer services (including
                    development and improvement of the CodeWhisperer services and underlying technology); (b) we may use
                    and store the CodeWhisperer Content that is not personal data to develop and improve AWS and
                    affiliate machine-learning and artificial-intelligence technologies; and (c) solely in connection
                    with the development and improvement described in clauses (a) and (b), we may store the Content in
                    an AWS region outside of the AWS region where you are using CodeWhisperer. If you have participated
                    in the CodeWhisperer preview and would like Your Content deleted, please contact us at
                    <a href="mailto:codewhisperer@amazon.com"> this link</a>. As part of the CodeWhisperer preview, we
                    may offer you the option to toggle CodeWhisperer Content sharing on or off through the Beta Service.
                    If you decline to share CodeWhisperer Content through the Beta Service for an account or set of
                    credentials, we will refrain from collecting the applicable CodeWhisperer Content for this purpose
                    and will delete any of that CodeWhisperer Content that we have collected for this purpose. In
                    addition, we may offer you the option through the Beta Service to limit the collection of metadata,
                    feedback, or other usage metrics which are not CodeWhisperer Content for service improvement (for
                    example, whether a recommendation was accepted or rejected, but not the content of that
                    recommendation).
                </div>
            </div>
            <br />
            <div>
                Notwithstanding any other term to the contrary in any agreement between you (or your affiliates) and
                AWS, and without limitation: <br />
                <div>
                    <div v-if="isCloud9">
                        <ul>
                            <li>
                                you acknowledge that CodeWhisperer output is a computational result based on the input
                                you provide to the Beta Service, and that multiple users may receive the same or similar
                                output. For clarity, although these computational results are Your Content, the same or
                                similar outputs are independently created, and AWS will not be restricted from providing
                                the same or similar output to other customers.
                            </li>
                            <li>
                                if you would like to instruct AWS to refrain from using collected CodeWhisperer Content
                                for service improvement, you must either: (a) submit a request at the deletion link
                                identified in these beta terms and refrain from further usage of the CodeWhisperer Beta
                                Service; or (b) if available, leverage the applicable data sharing toggle option(s)
                                within the CodeWhisperer Beta Service. This bullet point does not apply to Your Content
                                that is processed through CodeWhisperer via Lambda or Cloud9 interfaces.
                            </li>
                        </ul>
                    </div>
                    <div v-else>
                        <ul>
                            <li>
                                you acknowledge that CodeWhisperer output is a computational result based on the input
                                you provide to the Beta Service, and that multiple users may receive the same or similar
                                output. For clarity, although these computational results are Your Content, the same or
                                similar outputs are independently created, and AWS will not be restricted from providing
                                the same or similar output to other customers.
                            </li>
                            <li>
                                if you would like to instruct AWS to refrain from using collected CodeWhisperer Content
                                for service improvement, you must either: (a) submit a request at the deletion link
                                identified in these beta terms and refrain from further usage of the CodeWhisperer Beta
                                Service; or (b) if available, leverage the applicable data sharing toggle option(s)
                                within the CodeWhisperer Beta Service.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <p>
                The Beta Service is subject to change and cancellation.
                <b
                    >IF YOU DO NOT AGREE TO THESE TERMS AND CONDITIONS, YOU MAY NOT USE THE CodeWhisperer BETA
                    SERVICE.</b
                >
            </p>
        </div>
        <div class="container">
            <button type="button" id="cancel" class="block" @click="cancelCodeSuggestion">Reject</button>
            <button type="button" id="accept" @click="acceptCodeSuggestions">Accept and Turn on CodeWhisperer</button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { CodeWhispererWebview } from './backend'
import { WebviewClientFactory } from '../../webviews/client'
import saveData from '../../webviews/mixins/saveData'
const client = WebviewClientFactory.create<CodeWhispererWebview>()
export default defineComponent({
    name: 'codewhisperer',
    // This ensures that everything in \`data\` is persisted
    mixins: [saveData],
    // Everything relating to component state should be returned by this method
    data() {
        return {
            userInput: '',
            errorMessage: '',
            autodisabled: false,
            bindValue: 'alt+c',
            isCloud9: false,
        }
    },
    // Executed on component creation
    async created() {
        client.onDidChangeKeyBinding(val => {
            this.bindValue = val
        })
        client.onDidChangeTriggerStatus(val => {
            this.autodisabled = val
        })
        this.isCloud9 = await client.isCloud9()
    },
    methods: {
        async acceptCodeSuggestions() {
            client.controlTrigger()
        },
        async cancelCodeSuggestion() {
            client.cancelCodeSuggestion()
        },
    },
})
<\/script>

<style scoped>
/* Styling specific this component can be placed here */
.container {
    display: flex;
    flex-direction: row;
    column-gap: 2em;
    justify-content: flex-end;
    padding-bottom: 1em;
    background-color: transparent;
}
.block {
    background-color: #464e57;
}
.block:hover {
    background-color: transparent;
}
#event-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
.binding-style {
    font-weight: 700;
    color: #1e90ff;
}
#cancel,
#accept {
    display: block;
}

.button-right {
    float: right;
}
.codewhisperer-preview-terms {
    text-align: center;
    font-weight: bold;
    text-decoration-line: underline;
}
.table-bordered {
    border-collapse: collapse;
}
table,
th,
td {
    border: 1px solid gray;
}
</style>
`],sourceRoot:""}]);const S=w},645:e=>{"use strict";e.exports=function(n){var r=[];return r.toString=function(){return this.map(function(s){var l="",C=typeof s[5]!="undefined";return s[4]&&(l+="@supports (".concat(s[4],") {")),s[2]&&(l+="@media ".concat(s[2]," {")),C&&(l+="@layer".concat(s[5].length>0?" ".concat(s[5]):""," {")),l+=n(s),C&&(l+="}"),s[2]&&(l+="}"),s[4]&&(l+="}"),l}).join("")},r.i=function(s,l,C,w,S){typeof s=="string"&&(s=[[null,s,void 0]]);var k={};if(C)for(var O=0;O<this.length;O++){var D=this[O][0];D!=null&&(k[D]=!0)}for(var N=0;N<s.length;N++){var h=[].concat(s[N]);C&&k[h[0]]||(typeof S!="undefined"&&(typeof h[5]=="undefined"||(h[1]="@layer".concat(h[5].length>0?" ".concat(h[5]):""," {").concat(h[1],"}")),h[5]=S),l&&(h[2]&&(h[1]="@media ".concat(h[2]," {").concat(h[1],"}")),h[2]=l),w&&(h[4]?(h[1]="@supports (".concat(h[4],") {").concat(h[1],"}"),h[4]=w):h[4]="".concat(w)),r.push(h))}},r}},537:e=>{"use strict";e.exports=function(n){var r=n[1],c=n[3];if(!c)return r;if(typeof btoa=="function"){var s=btoa(unescape(encodeURIComponent(JSON.stringify(c)))),l="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(s),C="/*# ".concat(l," */"),w=c.sources.map(function(S){return"/*# sourceURL=".concat(c.sourceRoot||"").concat(S," */")});return[r].concat(w).concat([C]).join(`
`)}return[r].join(`
`)}},744:(e,n)=>{"use strict";var r;r={value:!0},n.Z=(c,s)=>{for(const[l,C]of s)c[l]=C;return c}},646:(e,n,r)=>{var c=r(432);c.__esModule&&(c=c.default),typeof c=="string"&&(c=[[e.id,c,""]]),c.locals&&(e.exports=c.locals);var s=r(346).Z,l=s("62128ed5",c,!1,{})},346:(e,n,r)=>{"use strict";r.d(n,{Z:()=>j});function c(t,d){for(var i=[],a={},o=0;o<d.length;o++){var v=d[o],u=v[0],V=v[1],W=v[2],T=v[3],_={id:t+":"+o,css:V,media:W,sourceMap:T};a[u]?a[u].parts.push(_):i.push(a[u]={id:u,parts:[_]})}return i}var s=typeof document!="undefined";if(typeof DEBUG!="undefined"&&DEBUG&&!s)throw new Error("vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.");var l={},C=s&&(document.head||document.getElementsByTagName("head")[0]),w=null,S=0,k=!1,O=function(){},D=null,N="data-vue-ssr-id",h=typeof navigator!="undefined"&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());function j(t,d,i,a){k=i,D=a||{};var o=c(t,d);return P(o),function(u){for(var V=[],W=0;W<o.length;W++){var T=o[W],_=l[T.id];_.refs--,V.push(_)}u?(o=c(t,u),P(o)):o=[];for(var W=0;W<V.length;W++){var _=V[W];if(_.refs===0){for(var $=0;$<_.parts.length;$++)_.parts[$]();delete l[_.id]}}}}function P(t){for(var d=0;d<t.length;d++){var i=t[d],a=l[i.id];if(a){a.refs++;for(var o=0;o<a.parts.length;o++)a.parts[o](i.parts[o]);for(;o<i.parts.length;o++)a.parts.push(U(i.parts[o]));a.parts.length>i.parts.length&&(a.parts.length=i.parts.length)}else{for(var v=[],o=0;o<i.parts.length;o++)v.push(U(i.parts[o]));l[i.id]={id:i.id,refs:1,parts:v}}}}function R(){var t=document.createElement("style");return t.type="text/css",C.appendChild(t),t}function U(t){var d,i,a=document.querySelector("style["+N+'~="'+t.id+'"]');if(a){if(k)return O;a.parentNode.removeChild(a)}if(h){var o=S++;a=w||(w=R()),d=Y.bind(null,a,o,!1),i=Y.bind(null,a,o,!0)}else a=R(),d=K.bind(null,a),i=function(){a.parentNode.removeChild(a)};return d(t),function(u){if(u){if(u.css===t.css&&u.media===t.media&&u.sourceMap===t.sourceMap)return;d(t=u)}else i()}}var Z=function(){var t=[];return function(d,i){return t[d]=i,t.filter(Boolean).join(`
`)}}();function Y(t,d,i,a){var o=i?"":a.css;if(t.styleSheet)t.styleSheet.cssText=Z(d,o);else{var v=document.createTextNode(o),u=t.childNodes;u[d]&&t.removeChild(u[d]),u.length?t.insertBefore(v,u[d]):t.appendChild(v)}}function K(t,d){var i=d.css,a=d.media,o=d.sourceMap;if(a&&t.setAttribute("media",a),D.ssrId&&t.setAttribute(N,d.id),o&&(i+=`
/*# sourceURL=`+o.sources[0]+" */",i+=`
/*# sourceMappingURL=data:application/json;base64,`+btoa(unescape(encodeURIComponent(JSON.stringify(o))))+" */"),t.styleSheet)t.styleSheet.cssText=i;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(i))}}}},G={};function A(e){var n=G[e];if(n!==void 0)return n.exports;var r=G[e]={id:e,exports:{}};return Q[e](r,r.exports,A),r.exports}A.n=e=>{var n=e&&e.__esModule?()=>e.default:()=>e;return A.d(n,{a:n}),n},A.d=(e,n)=>{for(var r in n)A.o(n,r)&&!A.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:n[r]})},A.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),A.r=e=>{typeof Symbol!="undefined"&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var L={};(()=>{"use strict";A.r(L);const e=Vue,n=f=>((0,e.pushScopeId)("data-v-1f6bf60a"),f=f(),(0,e.popScopeId)(),f),r=n(()=>(0,e.createElementVNode)("h1",{class:"codewhisperer-preview-terms"},"Amazon CodeWhisperer Terms of Service",-1)),c={style:{width:"100%"}},s=(0,e.createStaticVNode)('<p data-v-1f6bf60a> The Amazon CodeWhisperer service is provided as a &#39;Beta Service&#39; and an &#39;AI Service&#39; as defined in the AWS Service Terms. Usage of the CodeWhisperer Beta Service is governed by your Agreement with AWS and the <a href="https://aws.amazon.com/service-terms/" data-v-1f6bf60a> AWS Service Terms</a>, as supplemented by these additional terms, which are made part of Section 2 (&#39;Betas and Previews&#39;) of the Service Terms. Any term undefined in these CodeWhisperer preview terms will have the meaning assigned to it in the Agreement and Service Terms. </p><div data-v-1f6bf60a> Before using the CodeWhisperer Beta Service, please review the Betas and Previews terms found <a href="https://aws.amazon.com/service-terms/" data-v-1f6bf60a> here</a>. The CodeWhisperer Beta Service uses certain information to provide and/or improve the service, including: <br data-v-1f6bf60a><br data-v-1f6bf60a><div data-v-1f6bf60a><table class="table-bordered" data-v-1f6bf60a><tr data-v-1f6bf60a><th data-v-1f6bf60a>Data Type</th><th data-v-1f6bf60a>Examples</th></tr><tr data-v-1f6bf60a><td data-v-1f6bf60a>Contextual information</td><td data-v-1f6bf60a>file content, filename, programming language, cursor location, active line number</td></tr><tr data-v-1f6bf60a><td data-v-1f6bf60a>Feedback</td><td data-v-1f6bf60a> acceptance or rejection of recommendations, modifications to recommendations, user settings </td></tr><tr data-v-1f6bf60a><td data-v-1f6bf60a>Telemetry metrics</td><td data-v-1f6bf60a>latency, errors, CodeWhisperer API interactions</td></tr><tr data-v-1f6bf60a><td data-v-1f6bf60a>User environment information</td><td data-v-1f6bf60a>which IDE is being used, OS information, transfer protocols</td></tr></table></div></div><br data-v-1f6bf60a>',3),l={key:0},S=[n(()=>(0,e.createElementVNode)("p",null,[(0,e.createTextVNode)(" The CodeWhisperer preview period will help us conduct key testing and research in order to improve CodeWhisperer and prepare it for general availability. For Your Content processed by the CodeWhisperer Beta Service (the \u201CCodeWhisperer Content\u201D), you agree and instruct that (a) we may use and store the CodeWhisperer Content to maintain and provide the CodeWhisperer services (including development and improvement of the CodeWhisperer services and underlying technology); (b) we may use and store the CodeWhisperer Content that is not personal data to develop and improve AWS and affiliate machine-learning and artificial-intelligence technologies; and (c) solely in connection with the development and improvement described in clauses (a) and (b), we may store the Content in an AWS region outside of the AWS region where you are using CodeWhisperer. If you have participated in the CodeWhisperer preview and would like Your Content deleted, please contact us at "),(0,e.createElementVNode)("a",{href:"mailto:codewhisperer@amazon.com"}," this link"),(0,e.createTextVNode)(". As part of the CodeWhisperer preview, we may offer you the option to toggle CodeWhisperer Content sharing on or off through the Beta Service. If you decline to share CodeWhisperer Content through the Beta Service for an account or set of credentials, we will refrain from collecting the applicable CodeWhisperer Content for this purpose and will delete any of that CodeWhisperer Content that we have collected for this purpose. This paragraph does not apply to Your Content that is processed through CodeWhisperer via Lambda or Cloud9 interfaces. ")],-1)),n(()=>(0,e.createElementVNode)("p",null," In addition, we may offer you the option through the Beta Service to limit the collection of metadata, feedback, or other usage metrics which are not CodeWhisperer Content for service improvement (for example, whether a recommendation was accepted or rejected, but not the content of that recommendation). ",-1))],k={key:1},h=[(0,e.createTextVNode)(" The CodeWhisperer preview period will help us conduct key testing and research in order to improve CodeWhisperer and prepare it for general availability. For Your Content processed by the CodeWhisperer Beta Service (the \u201CCodeWhisperer Content\u201D), you agree and instruct that (a) we may use and store the CodeWhisperer Content to maintain and provide the CodeWhisperer services (including development and improvement of the CodeWhisperer services and underlying technology); (b) we may use and store the CodeWhisperer Content that is not personal data to develop and improve AWS and affiliate machine-learning and artificial-intelligence technologies; and (c) solely in connection with the development and improvement described in clauses (a) and (b), we may store the Content in an AWS region outside of the AWS region where you are using CodeWhisperer. If you have participated in the CodeWhisperer preview and would like Your Content deleted, please contact us at "),n(()=>(0,e.createElementVNode)("a",{href:"mailto:codewhisperer@amazon.com"}," this link",-1)),(0,e.createTextVNode)(". As part of the CodeWhisperer preview, we may offer you the option to toggle CodeWhisperer Content sharing on or off through the Beta Service. If you decline to share CodeWhisperer Content through the Beta Service for an account or set of credentials, we will refrain from collecting the applicable CodeWhisperer Content for this purpose and will delete any of that CodeWhisperer Content that we have collected for this purpose. In addition, we may offer you the option through the Beta Service to limit the collection of metadata, feedback, or other usage metrics which are not CodeWhisperer Content for service improvement (for example, whether a recommendation was accepted or rejected, but not the content of that recommendation). ")],j=n(()=>(0,e.createElementVNode)("br",null,null,-1)),P=(0,e.createTextVNode)(" Notwithstanding any other term to the contrary in any agreement between you (or your affiliates) and AWS, and without limitation: "),R=n(()=>(0,e.createElementVNode)("br",null,null,-1)),U={key:0},Y=[n(()=>(0,e.createElementVNode)("ul",null,[(0,e.createElementVNode)("li",null," you acknowledge that CodeWhisperer output is a computational result based on the input you provide to the Beta Service, and that multiple users may receive the same or similar output. For clarity, although these computational results are Your Content, the same or similar outputs are independently created, and AWS will not be restricted from providing the same or similar output to other customers. "),(0,e.createElementVNode)("li",null," if you would like to instruct AWS to refrain from using collected CodeWhisperer Content for service improvement, you must either: (a) submit a request at the deletion link identified in these beta terms and refrain from further usage of the CodeWhisperer Beta Service; or (b) if available, leverage the applicable data sharing toggle option(s) within the CodeWhisperer Beta Service. This bullet point does not apply to Your Content that is processed through CodeWhisperer via Lambda or Cloud9 interfaces. ")],-1))],K={key:1},d=[n(()=>(0,e.createElementVNode)("ul",null,[(0,e.createElementVNode)("li",null," you acknowledge that CodeWhisperer output is a computational result based on the input you provide to the Beta Service, and that multiple users may receive the same or similar output. For clarity, although these computational results are Your Content, the same or similar outputs are independently created, and AWS will not be restricted from providing the same or similar output to other customers. "),(0,e.createElementVNode)("li",null," if you would like to instruct AWS to refrain from using collected CodeWhisperer Content for service improvement, you must either: (a) submit a request at the deletion link identified in these beta terms and refrain from further usage of the CodeWhisperer Beta Service; or (b) if available, leverage the applicable data sharing toggle option(s) within the CodeWhisperer Beta Service. ")],-1))],i=n(()=>(0,e.createElementVNode)("p",null,[(0,e.createTextVNode)(" The Beta Service is subject to change and cancellation. "),(0,e.createElementVNode)("b",null,"IF YOU DO NOT AGREE TO THESE TERMS AND CONDITIONS, YOU MAY NOT USE THE CodeWhisperer BETA SERVICE.")],-1)),a={class:"container"};function o(f,p,m,g,B,y){return(0,e.openBlock)(),(0,e.createElementBlock)("div",null,[r,(0,e.createElementVNode)("div",c,[s,(0,e.createElementVNode)("div",null,[f.isCloud9?((0,e.openBlock)(),(0,e.createElementBlock)("div",l,S)):((0,e.openBlock)(),(0,e.createElementBlock)("div",k,h))]),j,(0,e.createElementVNode)("div",null,[P,R,(0,e.createElementVNode)("div",null,[f.isCloud9?((0,e.openBlock)(),(0,e.createElementBlock)("div",U,Y)):((0,e.openBlock)(),(0,e.createElementBlock)("div",K,d))])]),i]),(0,e.createElementVNode)("div",a,[(0,e.createElementVNode)("button",{type:"button",id:"cancel",class:"block",onClick:p[0]||(p[0]=(...b)=>f.cancelCodeSuggestion&&f.cancelCodeSuggestion(...b))},"Reject"),(0,e.createElementVNode)("button",{type:"button",id:"accept",onClick:p[1]||(p[1]=(...b)=>f.acceptCodeSuggestions&&f.acceptCodeSuggestions(...b))},"Accept and Turn on CodeWhisperer")])])}/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */class v{static registerGlobalCommands(){const p=new Event("remount");window.addEventListener("message",m=>{const{command:g}=m.data;g==="$clear"&&(vscode.setState({}),this.messageListeners.forEach(B=>this.removeListener(B)),window.dispatchEvent(p))})}static addListener(p){this.messageListeners.add(p),window.addEventListener("message",p)}static removeListener(p){this.messageListeners.delete(p),window.removeEventListener("message",p)}static sendRequest(p,m,g){const B=JSON.parse(JSON.stringify(g)),y=new Promise((b,M)=>{const E=z=>{const I=z.data;if(p===I.id)if(this.removeListener(E),window.clearTimeout(x),I.error===!0){const F=JSON.parse(I.data);M(new Error(F.message))}else I.event?(typeof g[0]!="function"&&M(new Error(`Expected frontend event handler to be a function: ${m}`)),b(this.registerEventHandler(m,g[0]))):b(I.data)},x=setTimeout(()=>{this.removeListener(E),M(new Error(`Timed out while waiting for response: id: ${p}, command: ${m}`))},3e5);this.addListener(E)});return vscode.postMessage({id:p,command:m,data:B}),y}static registerEventHandler(p,m){const g=B=>{const y=B.data;if(y.command===p){if(!y.event)throw new Error(`Expected backend handler to be an event emitter: ${p}`);m(y.data)}};return this.addListener(g),{dispose:()=>this.removeListener(g)}}static create(){return this.initialized||(this.initialized=!0,this.registerGlobalCommands()),new Proxy({},{set:()=>{throw new TypeError("Cannot set property to webview client")},get:(p,m)=>{var g;if(typeof m!="string"){console.warn(`Tried to index webview client with non-string property: ${String(m)}`);return}if(m==="init"){const y=(g=vscode.getState())!=null?g:{};if(y.__once)return()=>Promise.resolve();vscode.setState(Object.assign(y,{__once:!0}))}const B=(this.counter++).toString();return(...y)=>this.sendRequest(B,m,y)}})}}v.counter=0,v.initialized=!1,v.messageListeners=new Set;/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */const u=new Set;window.addEventListener("remount",()=>u.clear());const W={created(){var f,p,m,g,B;if(this.$data===void 0)return;const y=(f=vscode.getState())!=null?f:{};this.$options._count=((p=this.$options._count)!=null?p:0)+1;const b=(g=this.id)!=null?g:`${(m=this.name)!=null?m:`DEFAULT-${u.size}`}-${this.$options._count}`;if(this.$options._unid=b,u.has(b)){console.warn(`Component "${b}" already exists. State-saving functionality will be disabled.`);return}u.add(b);const M=(B=y[b])!=null?B:{};Object.keys(this.$data).forEach(E=>{var x;this.$data[E]=(x=M[E])!=null?x:this.$data[E]}),Object.keys(this.$data).forEach(E=>{this.$watch(E,x=>{var z,I;const F=(z=vscode.getState())!=null?z:{},ne=Object.assign((I=F[b])!=null?I:{},{[E]:x!==void 0?JSON.parse(JSON.stringify(x)):void 0});vscode.setState(Object.assign(F,{[b]:ne}))},{deep:!0})})}},T=v.create(),_=(0,e.defineComponent)({name:"codewhisperer",mixins:[W],data(){return{userInput:"",errorMessage:"",autodisabled:!1,bindValue:"alt+c",isCloud9:!1}},async created(){T.onDidChangeKeyBinding(f=>{this.bindValue=f}),T.onDidChangeTriggerStatus(f=>{this.autodisabled=f}),this.isCloud9=await T.isCloud9()},methods:{async acceptCodeSuggestions(){T.controlTrigger()},async cancelCodeSuggestion(){T.cancelCodeSuggestion()}}});var $=A(646),ee=A(744);const te=(0,ee.Z)(_,[["render",o],["__scopeId","data-v-1f6bf60a"]]);/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */const q=()=>(0,e.createApp)(te),X=q();X.mount("#vue-app"),window.addEventListener("remount",()=>{X.unmount(),q().mount("#vue-app")})})();var H=this;for(var J in L)H[J]=L[J];L.__esModule&&Object.defineProperty(H,"__esModule",{value:!0})})();

//# sourceMappingURL=index.js.map