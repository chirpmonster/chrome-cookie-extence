//废弃功能

// let timer;
//
// chrome.runtime.sendMessage(
//     {
//         type: 'autoCompleteStatus',
//     },
//     (res) => {
//         if (res.success) {
//             if(res.autoCompleteStatus){
//                 addAutoFormListener()
//             }
//         }
//     }
// );
//
// // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
// //         console.log(123)
// //         clearInterval(timer)
// //
// // });
//
// function addAutoFormListener(){
//     if (window.location.href.includes('mfp.mogu-inc.com/deploy')) {
//         timer=setInterval(() => {
//             let projectName=document.getElementsByClassName('ui selectable basic table')[0].children[0].children[1].children[1].innerText
//             let formList = document.getElementsByClassName('form-control')
//             if (formList && formList.length === 5) {
//                 if (formList[2].rows !== 5) {
//                     const preVersion=document.getElementsByClassName('ml10 text-primary')?.[0]?.children?.[1]?.innerText
//                     let isCore=''
//                     let isCorelist=['mgj-pc-assistant','seller-cycle','mgj-pc-merchant-wallet','seller-actor','seller-order-list']
//                     for(let i=0;i<isCorelist.length;i++){
//                         if(isCorelist[0]===projectName){
//                             isCore='是'
//                         }
//                     }
//                     formList[2].rows = 5
//                     formList[2].value =
//                         '业务方：\n发布内容：\nCR人员：\n是否为核心链路：'+isCore
//                     formList[4].value =
//                         '回归的版本号：'+preVersion+'\n回归的分支：\n回归的commit：上一个线上版本'
//                 }
//             }
//         }, 1000)
//     }
// }
//
//
//
//
//
//
