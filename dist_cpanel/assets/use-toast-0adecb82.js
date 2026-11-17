import{r as s}from"./index-faaecbcb.js";let n=0;const r=new Set;function l(){return{toast:s.useCallback(t=>{const e=`toast-${++n}-${Date.now()}`,a={id:e,title:t.title,description:t.description,variant:t.variant||"default"};r.forEach(o=>o(a)),setTimeout(()=>{r.forEach(o=>o({...a,id:`remove-${e}`}))},5e3)},[])}}export{l as u};
//# sourceMappingURL=use-toast-0adecb82.js.map
