const WIDTH=640;
const HEIGHT=480;

class App{
  constructor({video,view}){
    this.video=video;
    this.view=view;
    this.needsStopUpdate = false;
    this.promiseSetup = this.setupAsync();
  }
  async setupStatsAsync(){
    this.stats = new Stats();
    document.body.appendChild( this.stats.dom );
  }
  async setupTensorflowAsync(){
    this.model = await blazeface.load();
  }
  async setupVideoAsync(){
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode:"user",
        width: WIDTH,
        height: HEIGHT,
      },
    });

    this.video.srcObject = this.mediaStream;
    await new Promise((resolve)=>{
      $(this.video).on("loadedmetadata",resolve);
    })
    this.video.play();
  }
  async setupAsync(){
    await this.setupStatsAsync();
    await this.setupTensorflowAsync();

    await this.setupVideoAsync();

    this.renderer=new PIXI.Renderer({
      width:WIDTH,
      height:HEIGHT,
      view:this.view,
    });
    this.stage=new PIXI.Container();
    this.videoSprite=PIXI.Sprite.from(this.video);
    this.stage.addChild(this.videoSprite);

    this.graphics=new PIXI.Graphics();
    this.stage.addChild(this.graphics);
    

    const animate=async ()=>{
      this.stats.begin();
      try{
        await this.updateAsync();
      }catch(e){
        console.error(e);
      }
      this.stats.end();
      if(!this.needsStopUpdate){
        requestAnimationFrame(animate);
      }
    };
    animate();
    
  }
  async destoryStatsAsync(){
    document.body.removeChild( this.stats.dom );
  }
  async destroyTensorflowAsync(){
    //必要ある？
  }
  async destroyVideoAsync(){
    const tracks = this.mediaStream.getTracks();
    for(let track of tracks){
      track.stop();
    }
  }
  async destroyAsync(){
    this.needsStopUpdate = true;
    await this.destroyVideoAsync();
    await this.destroyTensorflowAsync();
    await this.destoryStatsAsync();
  }

  async updateAsync(){
    const returnTensors = false;
    const predictions = await this.model.estimateFaces(this.video, returnTensors);
  
    this.graphics.clear();

    const getRect=(prediction)=>{
      const {topLeft,bottomRight}=prediction;
      const [left,top]=topLeft;
      const [right,bottom]=bottomRight;
      const width=right-left;
      const height=bottom-top;
      const rect={x:left,y:top,width,height};
      return rect;
    };

    const drawRect=(rect)=>{
      const {x,y,width,height}=rect;
      this.graphics.beginFill(0xff0000,0.5);
      this.graphics.drawRect(x,y,width,height);
    };

    for(let prediction of predictions){
      const rect=getRect(prediction);
      drawRect(rect);
    }
    this.renderer.render(this.stage);
  
  }

}
