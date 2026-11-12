import{k as t,i as e}from"./index-27448418.js";/**
 * @license lucide-react v1.28.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["path",{d:"M5 12h14",key:"1ays0h"}]],r=t("minus",n),c={async getMessages(s){return(await e.get("/messages",{params:s})).data},async getMessage(s){return(await e.get(`/messages/${s}`)).data},async sendMessage(s){return(await e.post("/messages",s)).data},async deleteMessage(s){await e.delete(`/messages/${s}`)}};export{r as M,c as m};
//# sourceMappingURL=messageService-d6929fc2.js.map
