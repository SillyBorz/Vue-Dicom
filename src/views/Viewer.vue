<!--  -->
<template>
  <div class="container">
    <ul class="tools"><li></li><li></li><li></li><li></li><li></li><li :class="{'is-paly': !isPlay,'is-paly2': isPlay}" @click="isPlay=!isPlay"></li></ul>
    <i class="line"></i>
    <div class="main">
      <aside>
        <ul class="imglist">
            <li v-for="(images,i) in imgList" :key="i">
            <div v-if="i<4">
              <p class="info"><span>{{images.seriesDesc}}</span><span>{{`${images.totalInstances} Images  ${images.modality}`}}</span></p>
              <div class="preview">
                <img @click="toggleImgList(i,0)" :src="images.url[0]" alt="">
                <img @click="toggleImgList(i,Math.floor(images.url.length/2))" v-if="images.url.length>2" :src="images.url[Math.floor(images.url.length/2)]" alt="">
                <img @click="toggleImgList(i,images.url.length-1)" v-if="images.url.length>1" :src="images.url[images.url.length-1]" alt="">
              </div>
              <div class="state">
                <i v-for="(url,j) in images.url" :key="j"
                  :class="{'red': j===0||j===images.url.length-1||j===Math.floor(images.url.length/2)}" 
                  :style="i===imgRow && j=== imgCol ? 'background:blue' : ''">
                  <img 
                    @load="loadImageState($event,i,j)" 
                    class="hide" 
                    :data-row="i"
                    :data-col="j"
                    :src="url" 
                    alt=""></i>
              </div>
            </div>  
            </li>
        </ul>
      </aside>
      <div>
        <!-- <div id="loadProgress" style="position:relative;">Dicom加载:</div> -->
        <!-- <div id="dicomImage" style="width:512px;height:512px;display: none;" oncontextmenu="return false"></div> -->
        <div id="image" @wheel="mouseWheel">
          <canvas style="width: 300px;" id="canvas"></canvas>
          <Slider v-model="imgCol" :tip-format="()=>imgCol+1" :max="imgEl[imgRow].length-1"></Slider>
        </div>
      </div>
    </div>
</div>
</template>

<script>

//引入 cornerstone,dicomParser,cornerstoneWADOImageLoader
import * as cornerstone from "cornerstone-core";  // * 渲染我们的图像，并提供有用的事件和方法，以使工具能够响应视口变化
import * as dicomParser from "dicom-parser";

import Hammer from 'hammerjs'; // * 为触摸事件和手势添加跨浏览器支持
// import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import '../assets/js/cornerstoneTools.js';

// 不建议 npm 安装 cornerstoneWADOImageLoader 如果你做了 会很头疼 
import * as cornerstoneWADOImageLoader from "../../static/lib/cornerstoneWADOImageLoader.js";
 
// * 指定要注册加载程序的基石实例 (这里不引入也行，会默认加载)
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
// * 设置图像加载程序
// cornerstone.registerImageLoader('http', cornerstoneWebImageLoader.loadImage)
// cornerstone.registerImageLoader('https', cornerstoneWebImageLoader.loadImage)
/*
*配置 webWorker (必须配置)
*
*注意这里的路径问题  如果路径不对 cornerstoneWADOImageLoaderWebWorker 会报错:
*        "index.html Uncaught SyntaxError: Unexpected token <"
*
*/
const config = {
  webWorkerPath: "/static/lib/cornerstoneWADOImageLoaderWebWorker.js",
  taskConfiguration: {
    decodeTask: {
      codecsPath: "/static/lib/cornerstoneWADOImageLoaderCodecs.js"
    }
  }
};
cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

console.log(cornerstoneTools);
console.log(cornerstoneMath);
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

export default {
  name: 'viewer',
  data () {
    console.log(cornerstoneWADOImageLoader);
    return {
      image: '',
      imgList: [], // * 图片列表
      imgRow: 0,  // * 序列下标
      imgCol: 0,  // * 对应序列的图片下标
      el: '', // * dicom image box el
      cvs: '', // * image canvas
      imgEl: [[]], // * 加载图片的列表
      imageDo: [], // * 当前序列图片详细信息
      timer: null, // * 播放计时器
      isPlay: false, // * 是否播放
      interval: 10, // * 每秒播放张数
    }
  },

  props: { },

  computed: { },

  created () { 
    this.getStudy()
    this.getSeries()
  },

  mounted () { 
    this.cvs = document.querySelector("#canvas");
    /* this.el = document.querySelector("#dicomImage");
    cornerstone.enable(this.el);
    // Dicom 加载 进度
    cornerstone.events.addEventListener(
      "cornerstoneimageloadprogress",
      function(event) {
        const eventData = event.detail;
        const loadProgress = document.getElementById("loadProgress");
        loadProgress.textContent = `Dicom加载: ${eventData.percentComplete}%`;
      }
    ); */
  },

  watch: { 
    isPlay(){// * 播放影像
      clearInterval(this.timer);
      if (!this.isPlay) return;
      this.timer = setInterval(()=>{
        this.imgCol++;
        if (this.imgCol > this.imgEl[this.imgRow].length-1) this.imgCol=0;
        this.drawImage(this.imgRow,this.imgCol)
      },1000/this.interval)
    },
    imgCol(){
      this.drawImage(this.imgRow,this.imgCol)
    },
  },

  methods: {
    mouseWheel(e){
      // e.deltaY 大于 0时向下滚动，小于0时向上滚动
      if (e.deltaY>0) {
        if (this.imgCol >= this.imgEl[this.imgRow].length-1) this.imgCol=0
        else this.imgCol++;
      }else{
        if (this.imgCol<=0) this.imgCol=this.imgEl[this.imgRow].length-1
        else this.imgCol--;
      }
      // this.drawImage(this.imgRow,this.imgCol)
    },
    toggleImgList(r,c){  // * 切换序列

      if(this.imgRow === r && this.imgCol === c) return;

      if(r!==this.imgRow) { // * 切换了序列
        this.imgRow = r;
        this.getImageDo(this.imgList[this.imgRow].studyUID,this.imgList[this.imgRow].seriesUID, c);
        return
      }
      this.imgCol = c;
      // this.drawImage(this.imgRow,this.imgCol)
      // this.loadAndViewImage("wadouri:" + this.imgList[this.imgRow].url[this.imgCol]+'&type=dicom')
    },
    
    drawImage(r,c){// * 渲染影像
      let w = this.imageDo[c].nativeRows;
      let h = this.imageDo[c].nativeColumns;
      if (w===0||h===0) {
        w = this.imgEl[r][c].width;
        h = this.imgEl[r][c].height;
      }
      this.cvs.width = w;
      this.cvs.height = h;
      let ctx = this.cvs.getContext('2d')
      ctx.drawImage(this.imgEl[r][c],0,0,w,h);
      /* let img = new Image();
      img.onload = ()=> {
        let w = this.imageDo[c].nativeRows;
        let h = this.imageDo[c].nativeColumns;
        this.cvs.width = w;
        this.cvs.height = h;
        ctx.drawImage(img,w,h);
      }
      img.src = this.imgList[r].url[c]; */
    },
    // * 图片加载
    loadImageState(e,row,col){
      if (!this.imgEl[row]) this.imgEl[row] = [];
      // this.imgEl[row][col] = this.imgList[row].url[col];
      this.imgEl[row][col] = e.target;
      if (row===0&&col===0) this.drawImage(0,0); 
      e.target.parentNode.className = e.target.parentNode.className+' complete';
    },
    
    //当点击加载图像时 调用 loadAndViewImage 加载 Dicom 图像
    loadAndViewImage(imageId) {
      var _this = this;
      //找到 要放置 Dicom Image 的元素
      // cornerstone.loadAndCacheImage 函数 负责加载图形 需要 图像地址 imageId
      cornerstone.loadAndCacheImage(imageId).then(
        function(image) {
          console.log(image);
          _this.image = image
          var viewport = cornerstone.getDefaultViewportForImage(this.el, image);
          console.log(viewport);
          console.log(image.getPixelData());
          let pixelData = image.getPixelData()
          cornerstone.displayImage(this.el, image, viewport);
          cornerstoneTools.mouseInput.enable(this.el);
          cornerstoneTools.mouseWheelInput.enable(this.el)
          // Enable all tools we want to use with this element
          cornerstoneTools.wwwc.activate(this.el, 1); // ww/wc is the default tool for left mouse button
          cornerstoneTools.pan.activate(this.el, 2); // pan is the default tool for middle mouse button
          // cornerstoneTools.zoom.activate(this.el, 4); // zoom is the default tool for right mouse button
          cornerstoneTools.zoomWheel.activate(this.el); // zoom is the default tool for middle mouse wheel
          cornerstoneTools.probe.enable(this.el);
          cornerstoneTools.length.enable(this.el);
          cornerstoneTools.ellipticalRoi.enable(this.el);
          cornerstoneTools.rectangleRoi.enable(this.el);
          cornerstoneTools.simpleAngle.enable(this.el);
          cornerstoneTools.highlight.enable(this.el);
          cornerstoneTools.magnify.enable(this.el);

          // console.log(cornerstone.getPixels(this.el, 0, 0, 512, 512));
          // console.log(cornerstoneWADOImageLoader.getMinMax(cornerstone.getPixels(this.el, 0, 0, 512, 512)));
          // getMinMax 获取像素最大最小值
          // console.log(cornerstoneWADOImageLoader.getMinMax(image.getPixelData()));
        },
        function(err) {
          console.log(err);
        }
      );
    },
    // * 患者序列
    getStudy(){
      this.$axios.post('/1_0_0_0/ImageDiagnose/Wado/study.do',this.$qs.stringify({studyUID: 1070}))
      .then(res=>{
        console.log(res);
      })
    },
    // * 图片序列
    getSeries(){
      this.$axios.post('/1_0_0_0/ImageDiagnose/Wado/series.do',this.$qs.stringify({studyID: 1070}))
      .then(res=>{
        this.imgList = res.data;
        this.imageDo = new Array(this.imgList.length)
        this.imgList.forEach((v,j)=>{
          v.url.forEach((url,i)=>{
            if (url.includes('../')) v.url[i] = 'http://demo.xrimage.com:8001/1_0_0_0/'+url.replace('../','');  
          })
          this.getImageDo(v.studyUID,v.seriesUID,j)
        })
        // this.currentImgList = this.imgList[0]
      })
    },
    // * 获取序列详情
    getImageDo(studyUID,seriesUID,i){
      this.$axios.post('/1_0_0_0/ImageDiagnose/Wado/image.do',this.$qs.stringify({studyUID: studyUID,seriesUID: seriesUID}))
      .then(res=>{ 
        this.imageDo[i] = res.data; 
      })
    },
  },

  components: { }
}
</script>

<style scoped lang="less">
.container{
  background: #262626;
}
.tools{
  display: flex;
  justify-content: flex-start;
  height: 40px;
  line-height: 40px;
  li{
    width: 36px;
    height: 36px;
    background: #000 url('../assets/images/tools/wwwc.svg') center/60% no-repeat;
    margin-right: 8px;
    border: 2px solid #666;
  }
  li:nth-child(2){
    background: #000 url('../assets/images/tools/inverts.svg') center/60% no-repeat;
  }
  li:nth-child(3){
    background: #000 url('../assets/images/tools/length.svg') center/60% no-repeat;
  }
  li:nth-child(4){
    background: #000 url('../assets/images/tools/zoom.svg') center/60% no-repeat;
  }
  li:nth-child(5){
    background: #000 url('../assets/images/tools/mpr3d.svg') center/60% no-repeat;
  }
  .is-paly{
    background: #000 url('../assets/images/tools/play.svg') center/60% no-repeat;
  }
  .is-paly2{
    background: #000 url('../assets/images/tools/play2.svg') center/60% no-repeat;
  }
}
.imglist{
  width: 300px;
  margin-top: 8px;
  border-right: 6px solid #111;
  .preview{
    display: flex;
    justify-content: flex-start;
    img{
      width: 80px;
      height: 80px;
      margin-right: 16px;
    }
  }
  .info{
    display: flex;
    justify-content: space-between;
    padding: 10px 8px;
    margin-bottom: 8px;
    font-size: 16px;
    color: #ffa940;
    background: #333;
  }
  .state {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 12px 0 20px;
    i{
      width: 6px;
      height: 6px;
      background: #bfbfbf;
      margin: 1px;
    }
    i.red{
      background: red;
    }
    .complete{
      background: #f5f5f5;
    }
  }
}

.main{
  display: flex;
  justify-content: flex-start;
}
#image{
  width: 700px;
}
</style>
