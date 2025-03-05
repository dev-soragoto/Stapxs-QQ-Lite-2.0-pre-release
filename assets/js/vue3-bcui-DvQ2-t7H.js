import{d as S,a as i,p as r,q as u,t as k,u as $,b as w,v as h,o as s,m as g,x as C,y as V,F as N,z as R,A,B as D,C as b,D as v,E as X}from"./@vue-D152I8w5.js";const B=(e,t)=>{const n=e.__vccOpts||e;for(const[l,o]of t)n[l]=o;return n},z=S({name:"ss-card",props:{remove:{type:String,default:void 0},title:{type:String,default:void 0},icon:{type:String,default:void 0}},data(){return{hasRemove:this.$attrs.onRemove!=null}},methods:{removeCard(){this.$emit("remove")}}}),F={class:"ss-card"},Y={key:0},O={key:0,class:"icon"},j={key:0},q={key:1,class:"body"};function G(e,t,n,l,o,f){const d=h("font-awesome-icon");return s(),i("div",F,[e.title?(s(),i("header",Y,[e.icon!=null?(s(),i("div",O,[e.icon.length<=0?(s(),i("div",j)):(s(),k(d,{key:1,icon:e.icon},null,8,["icon"]))])):r("",!0),u("span",null,$(e.title),1),t[0]||(t[0]=u("div",{style:{flex:"1"}},null,-1)),e.hasRemove?(s(),k(d,{key:1,icon:"fa-solid fa-xmark",onClick:e.removeCard},null,8,["onClick"])):r("",!0)])):r("",!0),e.$slots.default?(s(),i("div",q,[w(e.$slots,"default",{},void 0,!0)])):r("",!0)])}const p=B(z,[["render",G],["__scopeId","data-v-ae119801"]]);p.install=e=>{e.component(p.name,p)};const P=S({name:"bc-tab",emits:["selected"],props:{title:{type:String,default:void 0}},components:{Card:p},data(){return{tabId:Math.random().toString(36).substr(2),selectIndex:0}},methods:{tabSelect(e){this.selectIndex=e;const t=document.getElementById("bc-tab-"+this.tabId),n=t==null?void 0:t.children;if(n){for(let l=0;l<n.length;l++)if(n[l].nodeName=="DIV"&&(n[l].getAttribute("name")||n[l].getAttribute("icon"))){const o=n[l];l==e?(o.style.display="block",setTimeout(()=>{o.scrollTo(0,0)},100)):o.style.display="none"}}this.$emit("selected",e)},getTabLineStyle(e){const t=e-this.selectIndex;return`transform: translateX(calc(-${t}00% - (var(--bc-tab-margin) * 2 + 10px) * ${t}))`}},mounted(){this.tabSelect(0),this.$watch(()=>this.$slots.default?this.$slots.default().filter(e=>e.props).length:0,()=>{this.$nextTick(()=>{this.tabSelect(this.selectIndex)})})}}),U={class:"tab-main"},H={key:0,class:"tab-bar"},J={key:0},K=["onClick"],Q={key:1},W=["id"];function Z(e,t,n,l,o,f){const d=h("font-awesome-icon"),m=h("Card");return s(),i("div",U,[g(m,null,{default:C(()=>[e.$slots.default?(s(),i("ul",H,[e.title?(s(),i("span",J,$(e.title),1)):r("",!0),g(V,{name:"tabar"},{default:C(()=>[(s(!0),i(N,null,R(e.$slots.default().filter(a=>a.props),(a,c)=>{var I,M,T;return s(),i("li",{key:"bc-tab-"+this.tabId+"-"+((I=a.props)==null?void 0:I.name),onClick:E=>e.tabSelect(c),class:A(e.selectIndex==c?"select":"")},[(M=a.props)!=null&&M.icon?(s(),k(d,{key:0,icon:a.props.icon},null,8,["icon"])):(s(),i("span",Q,$((T=a.props)==null?void 0:T.name),1)),c==e.$slots.default().filter(E=>E.props).length-1?(s(),i("div",{key:2,style:D(e.getTabLineStyle(c))},null,4)):r("",!0)],10,K)}),128))]),_:1})])):r("",!0)]),_:1}),u("div",{class:"tab-body",id:"bc-tab-"+e.tabId},[w(e.$slots,"default",{},void 0,!0)],8,W)])}const _=B(P,[["render",Z],["__scopeId","data-v-c6f5df5d"]]);_.install=e=>{e.component(_.name,_)};const x=S({name:"bc-menu",emits:["close"],props:{name:{type:String,default:Math.random().toString(36).substr(2)},data:{type:Object,default:()=>({})}},components:{Card:p},data(){return{custonBody:void 0}},methods:{closeMsgMenu(e=""){e!==""?this.$emit("close",e):this.$emit("close",null)}},mounted(){const e=document.getElementById("msg-menu-body-"+this.name);if(e&&e.children[0]&&e.children[0].tagName==="UL"){this.custonBody=[];for(let t=0;t<e.children[0].children.length;t++){const n=e.children[0].children[t];this.custonBody.push({id:n.id,icon:n.getAttribute("icon"),name:n.innerText})}}}}),ee=["id"],te=["id"],ne=["onClick"];function se(e,t,n,l,o,f){const d=h("font-awesome-icon"),m=h("Card");return s(),i("div",{class:"msg-menu",id:"msg-menu-view-"+e.name,style:{display:"block !important"}},[b(u("div",{class:"msg-menu-bg",onClick:t[0]||(t[0]=a=>e.closeMsgMenu())},null,512),[[v,e.data.show]]),g(m,{class:A(e.data.show?"menu show":"menu"),style:D(`margin-left:${e.data.point.x}px;margin-top:${e.data.point.y}px;`)},{default:C(()=>[b(u("div",{id:"msg-menu-body-"+e.name},[w(e.$slots,"default",{},void 0,!0)],8,te),[[v,!e.custonBody]]),e.custonBody?(s(!0),i(N,{key:0},R(e.custonBody,a=>b((s(),i("div",{class:"item",onClick:c=>e.closeMsgMenu(a.id),key:"msg-menu-body-"+a.id},[g(d,{icon:a.icon},null,8,["icon"]),u("a",null,$(a.name),1)],8,ne)),[[v,e.data.list&&e.data.list.includes(a.id)]])),128)):r("",!0)]),_:3},8,["class","style"])],8,ee)}const y=B(x,[["render",se],["__scopeId","data-v-c8403a7e"]]),L={set(e,t){const n=t.pageX,l=t.pageY,o=document.getElementById("msg-menu-view-"+e),f=(o==null?void 0:o.getBoundingClientRect().left)||0,d=(o==null?void 0:o.getBoundingClientRect().top)||0,m=n-f,a=l-d;return X({show:!0,point:{x:m,y:a}})}};y.install=e=>{e.component(y.name,y),e.config.globalProperties.$bcui={"bc-menu":L}};y.append=L;export{_ as C,y as M,B as _};
