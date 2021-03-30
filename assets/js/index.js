

class App{
  constructor({video,view}){
    this.video=video;
    this.view=view;
    this.needsStopUpdate = false;
    this.promiseSetup = this.setupAsync();
  }
  async setupAsync(){
    this.model = await blazeface.load();
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode:"user",
      },
    });

    this.video.srcObject = this.mediaStream;
    await new Promise((resolve)=>{
      $(this.video).on("loadedmetadata",resolve);
    })
    this.video.play();

    const animate=async ()=>{
      try{
        await this.updateAsync();
      }catch(e){
        console.log(e);
      }
      if(!this.needsStopUpdate){
        requestAnimationFrame(animate);
      }
    };
    animate();
    
  }
  async destroyAsync(){
    this.needsStopUpdate = true;

    const tracks = this.mediaStream.getTracks();
    for(let track of tracks){
      track.stop();
    }
  }

  async updateAsync(){
    const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
    const predictions = await this.model.estimateFaces(this.video, returnTensors);
  
    if (predictions.length > 0) {
      // console.log(predictions[0]);
      /*
      `predictions` is an array of objects describing each detected face, for example:
  
      [
        {
          topLeft: [232.28, 145.26],
          bottomRight: [449.75, 308.36],
          probability: [0.998],
          landmarks: [
            [295.13, 177.64], // right eye
            [382.32, 175.56], // left eye
            [341.18, 205.03], // nose
            [345.12, 250.61], // mouth
            [252.76, 211.37], // right ear
            [431.20, 204.93] // left ear
          ]
        }
      ]
      */
  
      // for (let i = 0; i < predictions.length; i++) {
      //   const start = predictions[i].topLeft;
      //   const end = predictions[i].bottomRight;
      //   const size = [end[0] - start[0], end[1] - start[1]];
  
      //   // Render a rectangle over each detected face.
      //   ctx.fillRect(start[0], start[1], size[0], size[1]);
      // }
    }  
  
  }

}



async function main(){
  const video=$(".p-camera")[0];
  const view=$(".p-view")[0];
  window.app=new App({video,view});
  await window.app.promiseSetup;

}


$(main);

