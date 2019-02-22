<!--  -->
<template>
  <div class="container">
    <button type="button" id="downloadAndView">加载Dicom</button>
    <button type="button" @click="loadImage">加载Dicom2</button>
    <div id="loadProgress" style="position:relative;">Dicom加载:</div>
    <div id="dicomImage" style="width:512px;height:512px;" oncontextmenu="return false"></div>
    <div ref="canvas"></div>
</div>
</template>

<script>

//引入 cornerstone,dicomParser,cornerstoneWADOImageLoader
import * as cornerstone from "cornerstone-core";  // * 渲染我们的图像，并提供有用的事件和方法，以使工具能够响应视口变化
import * as dicomParser from "dicom-parser";

 import Hammer from 'hammerjs'; // * 为触摸事件和手势添加跨浏览器支持
 import * as cornerstoneTools from 'cornerstone-tools';
//  import cornerstoneTools from 'cornerstone-tools';
//  import cornerstoneTools from '../../static/lib/cornerstone-tools.js';

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

// var csTools = cornerstoneTools.init();
// console.log(csTools);
// csTools.addTool(cornerstoneTools.WwwcTool)


export default {
  name: 'viewer',
  data () {
    console.log(cornerstoneWADOImageLoader);
    
    return {
      image: ''
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
    const _this = this;
    var element = document.getElementById("dicomImage");
    cornerstone.enable(element);
    // 为 加载Dicom 按钮添加 点击事件 拼接 url 调用 loadAndViewImage 函数
    document
      .getElementById("downloadAndView")
      .addEventListener("click", function(e) {
        let url = 'http://demo.xrimage.com:8001/1_0_0_0/ImageDiagnose/Wado/imagestream.do?studyUID=1.2.840.113619.2.334.3.279719701.328.1536622685.311&seriesUID=1.2.840.113619.2.334.3.279719701.328.1536622685.316.3&objectUID=1.2.840.113619.2.334.3.279719701.328.1536622685.385.1&type=dicom';
        // 拼接url
        url = "wadouri:" + url;
        // 调用这个函数加载像,和激活工具
        _this.loadAndViewImage(url);
      });
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
    loadImage(){
      const element = document.querySelector('#dicomImage');
      cornerstoneTools.addToolState(element,'wwwc')
      console.log(cornerstoneTools.displayTool(element));
      cornerstoneTools.getToolOptions(element)
      cornerstoneTools.getToolState(element)
      cornerstoneTools.getToolState(element,'wwwc')
      console.log(cornerstoneTools.addToolState);
      
      // cornerstoneTools.wwwc(element,this.image);
      // csTools.addToolForElement(element,cornerstoneTools.WwwcTool)
      // console.log(cornerstoneTools['wwwc']);
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
        console.log(res);
        
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
    //当点击加载图像时 调用 loadAndViewImage 加载 Dicom 图像
    loadAndViewImage(imageId) {
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
          // console.log(image.getPixelData());
          let pixelData = image.getPixelData()
          cornerstone.displayImage(element, image, viewport);
          console.log(cornerstone.getPixels(element, 0, 0, 512, 512));
          // console.log(cornerstoneWADOImageLoader.getMinMax(cornerstone.getPixels(element, 0, 0, 512, 512)));
          // getMinMax 获取像素最大最小值
          // console.log(cornerstoneWADOImageLoader.getMinMax(image.getPixelData()));
        },
        function(err) {
          console.log(err);
        }
      );
    }
  },

  components: { }
}
</script>

<style scoped lang="less">

</style>
