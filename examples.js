// Loaded only by the isolated, editable example workspace.
(async function startExamples() {
  const store = "personal-assistant-examples-v1";
  window.exampleWorkspace = true;
  try {
    if (!localStorage.getItem(store)) {
      const projects = [], workspaceData = {}, documents = [], bodies = [];
      const day = new Date().toLocaleDateString("sv-SE");
      const id = () => crypto.randomUUID();
      const work = title => ({id:id(),title,status:"doing",required:true,requests:[],checklist:[]});
      const row = (title,state="missing",note="") => ({id:id(),title,state,note,refs:[],seenOutput:""});
      function project(name,goal,works) {
        const key=id();
        const colors=["#83e8d3","#c1b1ee","#eac184","#95c7df"];
        projects.push({id:key,name,color:colors[projects.length % colors.length],isSample:true});
        return workspaceData[key]={deliveryModelVersion:1,lifecycle:"active",goal:{title:goal},tasks:works,files:[],issues:[],activity:[],decisions:[],timeline:[]};
      }
      function list(task,title,person,items) {
        task.requests.push({id:id(),title,person,due:"",state:"preparing",direction:"outbound",rounds:[],items});
      }
      async function document(data,task,name,content) {
        const blob=new Blob(["教學範例 · 合成資料\n"+content],{type:"text/plain"});
        const bytes=await crypto.subtle.digest("SHA-256",await blob.arrayBuffer());
        const sha256=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
        const body={id:id(),name,sha256,blob,size:blob.size,type:blob.type};
        bodies.push(body);
        const version={id:id(),name,blobId:body.id,size:blob.size,type:blob.type,source:"stored",sha256,date:day};
        const doc={id:id(),name,versions:[version],currentVersionId:version.id,aliases:[],events:[]};
        documents.push(doc);
        const file={id:id(),documentId:doc.id,workIds:[task.id]};
        data.files.push(file);
        return {fileId:file.id,versionId:version.id,name,versionLabel:"v1"};
      }
      const submit=work("準備送件資料"), report=work("取得監察報告"), certificate=work("取得謄本");
      const permit=project("範例｜許可申請","取得許可並交付客戶",[submit,report,certificate]);
      certificate.parentId=submit.id;
      certificate.requests.push({id:id(),assignment:true,title:"取得謄本",person:"小林",returnTo:"我",direction:"inbound",state:"waiting",rounds:[]});
      const items=["公司謄本","申請表","監察報告","銀行流水","委託書","聯絡資料","公司概要","場所說明","組織資料","人員名單","計畫書","簽署頁"].map(t=>row(t));
      list(submit,"社勞士提供的清單（示例）","社勞士",items);
      items[0].sourceId=certificate.id;
      items[1].refs=[await document(permit,submit,"A社_最終候選_02.txt","申請資料草稿，簽署人待確認")];items[1].state="checking";
      submit.checklist.push({id:id(),title:"致電確認簽署人",done:false});items[1].stepId=submit.checklist[0].id;
      items[2].sourceId=report.id;
      report.listOutput={id:id(),at:new Date().toISOString(),note:"會計師交回正式報告",refs:[await document(permit,report,"RPT_07.txt","正式交回的監察報告示例")]};
      await document(permit,report,"計算底稿.txt","這是底稿，未被選為交回結果");
      items[3].refs=[await document(permit,submit,"bank_04.txt","四月示例"),await document(permit,submit,"bank_05.txt","五月示例")];items[3].state="revise";items[3].note="還缺六月";
      for(const item of items.slice(4)){item.state="ready";item.refs=[await document(permit,submit,item.title+".txt",item.title+"示例")];}

      const launch=work("確認首頁更新"), layout=work("製作首頁預覽");
      const site=project("範例｜網站更新","客戶確認後發布新版首頁",[launch,layout]);
      const preview=row("首頁預覽");preview.sourceId=layout.id;
      layout.listOutput={id:id(),at:new Date().toISOString(),note:"版面第一輪可供檢視",refs:[await document(site,layout,"版面交回說明.txt","首屏與行動版版面已交回")]};
      const urlVersion={id:id(),name:"首頁預覽（示意網址）",url:"https://example.org/",source:"link",date:day};
      const urlDoc={id:id(),name:urlVersion.name,source:"link",url:urlVersion.url,versions:[urlVersion],currentVersionId:urlVersion.id,aliases:[],events:[]};
      documents.push(urlDoc);
      const urlFile={id:id(),documentId:urlDoc.id,workIds:[layout.id]};
      site.files.push(urlFile);
      layout.listOutput.refs.push({fileId:urlFile.id,versionId:urlVersion.id,name:urlVersion.name,versionLabel:"v1"});
      list(launch,"上線前確認","客戶窗口",[preview,row("手機文案","checking","編輯已更新，等核對"),row("攝影師照片","missing","還缺兩張"),row("發布時段","ready","電話確認週五下午")]);

      const setup=work("彙整設立資料"), admin=work("核對公司名稱");
      const company=project("範例｜公司設立","完成設立與交接",[setup,admin]);
      const form=row("簽署表單","revise","客戶更換簽署人，待修正");form.refs=[await document(company,setup,"draft-A.txt","舊簽署人版本示例")];
      const title=row("名稱確認");title.sourceId=admin.id;
      list(setup,"送審前準備","承辦窗口",[title,form,row("聯絡窗口","ready","行政已核對")]);
      const audit=work("提供稅理士資料");
      const tax=project("範例｜稅理士報告","取得年度報告並交回客戶",[audit]);
      const ledger=row("決算書","checking");ledger.refs=[await document(tax,audit,"FY_final.txt","年度決算資料示例")];
      list(audit,"年度資料","稅理士",[ledger,row("銀行流水","revise","尚缺最後一個月份"),row("異常交易說明","ready","財務已電話說明")]);

      // A shared date can include a receipt, a review and an unrelated case milestone.
      function relativeDay(offset) {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return date.toLocaleDateString("sv-SE");
      }
      function milestone(task, title, field, offset) {
        task.milestones ||= [];
        task.milestones.push({id:id(),title,[field]:relativeDay(offset)});
      }
      permit.deadlineDate=relativeDay(7);
      site.deadlineDate=relativeDay(4);
      company.deadlineDate=relativeDay(9);
      tax.deadlineDate=relativeDay(6);
      milestone(submit,"確認送件範圍","actualDate",-4);
      milestone(submit,"確認簽署人","committedDate",2);
      milestone(report,"收到會計師底稿","actualDate",-2);
      milestone(layout,"完成手機版預覽","actualDate",-2);
      milestone(launch,"客戶檢視首頁","committedDate",2);
      milestone(setup,"收到設立委託書","actualDate",-3);
      milestone(admin,"確認公司名稱","actualDate",-2);
      milestone(audit,"與稅理士核對流水","committedDate",2);
      certificate.requests[0].due=relativeDay(2);
      certificate.requests[0].expectedDate=relativeDay(2);

      await new Promise((resolve,reject)=>{
        const open=indexedDB.open("personal-assistant-example-attachments",1);
        open.onupgradeneeded=()=>open.result.createObjectStore("bodies",{keyPath:"id"});
        open.onerror=()=>reject(open.error);
        open.onsuccess=()=>{
          const db=open.result,tx=db.transaction("bodies","readwrite");
          bodies.forEach(body=>tx.objectStore("bodies").put(body));
          tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};
        };
      });
      localStorage.setItem(store,JSON.stringify({schemaVersion:6,projects,workspaceData,documentLibrary:{documents}}));
    }
    for (const tag of document.querySelectorAll("script[data-example-src]")) {
      await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=tag.dataset.exampleSrc;script.onload=resolve;script.onerror=reject;document.body.append(script);});
    }
  } catch (error) { document.body.textContent="未能開啟範例工作區，請重新整理。"+(error.message || ""); }
})();
