





async function main(){
  const video=$(".p-camera")[0];
  const view=$(".p-view")[0];
  window.app=new App({video,view});
  await window.app.promiseSetup;

}


$(main);

