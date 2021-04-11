const WIDTH=640;
const HEIGHT=480;

//https://github.com/twitter/twemoji
//クロスオリジンの問題で直接参照できない。ダウンロードして使う。
const EMOJI_URL="assets/img/twemoji/1f604.png";

class App{
  constructor({video,view}){
    this.video=video;
    this.view=view;
    this.needsStopUpdate = false;
    this.promiseSetup = this.setupAsync();
  }
  async setupStats(){
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

    this.emojiTexture = PIXI.Texture.from(EMOJI_URL);

    this.setupStats();
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

    this.faceContainer=new PIXI.Container();
    this.stage.addChild(this.faceContainer);

    

    const animate=async ()=>{
      if(this.needsStopUpdate){
        return;
      }
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
  async destroyStats(){
    document.body.removeChild( this.stats.dom );
  }
  async destroyTensorflowAsync(){
    //何もしない
  }
  async destroyVideoAsync(){
    const tracks = this.mediaStream.getTracks();
    for(let track of tracks){
      track.stop();
    }
    this.video.srcObject=null;
  }
  async destroyAsync(){
    this.needsStopUpdate = true;
    await this.destroyVideoAsync();
    await this.destroyTensorflowAsync();
    this.destroyStats();
  }

  async updateAsync(){
    const returnTensors = false;
    const predictions = await this.model.estimateFaces(this.video, returnTensors);
  
    this.graphics.clear();
    this.faceContainer.removeChildren();

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
    const drawEmoji=(rect)=>{
      const emojiSprite=new PIXI.Sprite(this.emojiTexture);
      const length=Math.max(rect.width,rect.height);
      const center={
        x:rect.x+rect.width/2,
        y:rect.y+rect.height/2,
      }
      emojiSprite.anchor.set(0.5,0.5);
      emojiSprite.width=length;
      emojiSprite.height=length;
      emojiSprite.position.copyFrom(center);

      this.faceContainer.addChild(emojiSprite);
    };

    for(let prediction of predictions){
      const rect=getRect(prediction);
      // drawRect(rect);
      drawEmoji(rect);
    }
    this.renderer.render(this.stage);
  
  }

}
