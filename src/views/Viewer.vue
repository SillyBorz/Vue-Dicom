<!--  -->
<template>
  <div class="container">
    <ul class="tools"><li></li><li></li><li></li><li></li><li></li><li></li></ul>
    <i class="line"></i>
    <div class="main">
      <aside>
        <ul class="imglist">
          <li v-for="(images,i) in imgList" :key="i">
            <p class="info"><span>{{images.seriesDesc}}</span><span>{{`${images.totalInstances} Images  ${images.modality}`}}</span></p>
            <div class="preview" v-if="images.modality==='Case'||images.modality==='Report'">
              <img @click="drawImage(i,0)" :src="images.url[0]" alt="">
              <img @click="drawImage(i,Math.floor(images.url.length/2))" v-if="images.url.length>2" :src="images.url[Math.floor(images.url.length/2)]" alt="">
              <img @click="drawImage(i,images.url.length-1)" v-if="images.url.length>1" :src="images.url[images.url.length-1]" alt="">
            </div>
            <div v-else class="preview">
              <img @click="drawImage(i,0)" :src="'http://demo.xrimage.com:8001/1_0_0_0/'+images.url[0].replace('../','')" alt="">
              <img @click="drawImage(i,Math.floor(images.url.length/2))" v-if="images.url.length>2" :src="'http://demo.xrimage.com:8001/1_0_0_0/'+images.url[Math.floor(images.url.length/2)].replace('../','')" alt="">
              <img @click="drawImage(i,images.url.length-1)" v-if="images.url.length>1" :src="'http://demo.xrimage.com:8001/1_0_0_0/'+images.url[images.url.length-1].replace('../','')" alt="">
            </div>
            <div class="state">
              <i :class="{'red': j===0||j===images.url.length-1||j===Math.floor(images.url.length/2)}" 
                v-for="(url,j) in images.url" :key="j">
                <img 
                  @load="loadImage($event,)" 
                  class="hide" 
                  :src="images.modality==='Case'||images.modality==='Report' ? url : 
                  'http://demo.xrimage.com:8001/1_0_0_0/'+images.url[j].replace('../','')" 
                  alt=""></i>
            </div>
          </li>
        </ul>
      </aside>
      <div>
        <button type="button" id="downloadAndView">加载Dicom</button>
        <button type="button" @click="loadImage">加载Dicom2</button>
        <div id="loadProgress" style="position:relative;">Dicom加载:</div>
        <div id="dicomImage" style="width:512px;height:512px;" oncontextmenu="return false"></div>
        <div ref="canvas"></div>
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

// * 要禁用触摸事件侦听器：
/* const config2 = {
  touchEnabled: false
}; */
console.log(cornerstoneTools);
console.log(cornerstoneMath);
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
// cornerstoneTools.external.cornerstone = cornerstone;
// var csTools = cornerstoneTools.init();
// console.log(csTools);
// csTools.addTool(cornerstoneTools.WwwcTool)

export default {
  name: 'viewer',
  data () {
    console.log(cornerstoneWADOImageLoader);
    
    return {
      image: '',
      imgList: [],
      imgRow: 0,  // * 序列下标
      imgCol: 0,  // * 对应序列的图片下标
    }
  },

  props: { },

  computed: { },

  created () { 
    this.getStudy()
    this.getSeries()
  },

  mounted () { 
    /* this.$axios.get('../../static/1111.json')
    .then(res=>{
      console.log(res.data);
      let x = res.data.length
      let y = res.data[0].length
      let z = res.data[0][0].length
      let imgArr = []
      res.data.forEach((x,i)=>{
        x.forEach((y,j)=>{
          // console.log(y[0]);
          imgArr = imgArr.concat(y[0])
        })
      })
      imgArr = new Uint8ClampedArray(imgArr)
      let img = new ImageData(imgArr, x , y)
      console.log(img);
      console.log(x,y,z);
      let canvas = document.createElement('canvas');
      this.$refs.canvas.appendChild(canvas);
      canvas.width = x;
      canvas.height = y;
      let ctx = canvas.getContext('2d');
      ctx.putImageData(img,0,0)
    }) */
    const element = document.querySelector('#dicomImage');
    cornerstone.enable(element);
    // Dicom 加载 进度
    cornerstone.events.addEventListener(
      "cornerstoneimageloadprogress",
      function(event) {
        const eventData = event.detail;
        const loadProgress = document.getElementById("loadProgress");
        loadProgress.textContent = `Dicom加载: ${eventData.percentComplete}%`;
      }
    );
  },

  watch: { },

  methods: {
    drawImage(r,c){
      r && (this.imgRow = r);
      c && (this.imgCol = c);
      this.loadAndViewImage("wadouri:http://demo.xrimage.com:8001/1_0_0_0/" + this.imgList[this.imgRow].url[this.imgCol].replace('../','')+'&type=dicom')
    },
    loadImage(e){
      e.target.parentNode.className = e.target.parentNode.className+' complete';
    },
    
    //当点击加载图像时 调用 loadAndViewImage 加载 Dicom 图像
    loadAndViewImage(imageId) {
      console.log(imageId);
      
      var _this = this;
      //找到 要放置 Dicom Image 的元素
      var element = document.getElementById("dicomImage");
      // cornerstone.loadAndCacheImage 函数 负责加载图形 需要 图像地址 imageId
      cornerstone.loadAndCacheImage(imageId).then(
        function(image) {
          console.log(image);
          _this.image = image
          var viewport = cornerstone.getDefaultViewportForImage(element, image);
          console.log(viewport);
          console.log(image.getPixelData());
          let pixelData = image.getPixelData()
          cornerstone.displayImage(element, image, viewport);
          cornerstoneTools.mouseInput.enable(element);
          cornerstoneTools.mouseWheelInput.enable(element)
          // Enable all tools we want to use with this element
          cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
          cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
          // cornerstoneTools.zoom.activate(el, 4); // zoom is the default tool for right mouse button
          cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel
          cornerstoneTools.probe.enable(element);
          cornerstoneTools.length.enable(element);
          cornerstoneTools.ellipticalRoi.enable(element);
          cornerstoneTools.rectangleRoi.enable(element);
          cornerstoneTools.simpleAngle.enable(element);
          cornerstoneTools.highlight.enable(element);
          cornerstoneTools.magnify.enable(element);

          // console.log(cornerstone.getPixels(element, 0, 0, 512, 512));
          // console.log(cornerstoneWADOImageLoader.getMinMax(cornerstone.getPixels(element, 0, 0, 512, 512)));
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
    getSeries(){
      this.$axios.post('/1_0_0_0/ImageDiagnose/Wado/series.do',this.$qs.stringify({studyID: 1070}))
      .then(res=>{
        this.imgList = res.data;
      })
    },
    /* init() {
      this.ele = document.createElement('canvas');
      document.body.appendChild(this.ele);
      this.ele.width = '300';
      this.ele.height = '300';
      this.ctx = this.ele.getContext('2d');
      // this.ctx.fillRect(25, 25, 100, 100);
      // this.ctx.clearRect(45, 45, 60, 60);
      // this.ctx.strokeRect(50, 50, 50, 50);
      return this.ctx;
    } */
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
  li:nth-child(6){
    background: #000 url('../assets/images/tools/wwwc.svg') center/60% no-repeat;
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

</style>
