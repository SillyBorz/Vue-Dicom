<template>
  <div class="cornerstone-element-wrapper">
    <div class="cornerstone-element" data-index="0" oncontextmenu="return false"></div>
  </div>
</template>

<script>
// Setup image loader
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstone.registerImageLoader('http', cornerstoneWebImageLoader.loadImage)
cornerstone.registerImageLoader('https', cornerstoneWebImageLoader.loadImage)

// Setup tools
const csTools = cornerstoneTools.init();

// Enable Element
const element = document.querySelector('.cornerstone-element');
cornerstone.enable(element);

// Add Tool
const LengthTool = cornerstoneTools['LengthTool'];
csTools.addTool(LengthTool);

// Set Tool Active
console.log(csTools.store)
csTools.setToolActive('Length', { mouseButtonMask: 1 });

// Display an image
const imageId = 'https://www.asteris.biz/Keystone/ImageDownload.aspx?ClinicCode=TESTKEYSTONE&ImageId=01b1755e-33d1-4b24-b9af-a4a019689d5f&ImageType=PreviewImage&FrameIndex=0';
cornerstone.loadImage(imageId).then(function (image) {
  cornerstone.displayImage(element, image);
});
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.cornerstone-element-wrapper,
.cornerstone-element {
  width: 512px;
  height: 512px;
  margin: 0 auto;
}
</style>
