// In the preload script.
const { ipcRenderer, dialog, contextBridge } = require('electron')

let mediaRecorder;
const recordedChunks = [];

ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: { 
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1280,
          maxWidth: 1280,
          minHeight: 720,
          maxHeight: 720
        }
      }
    })
    handleStream(stream)
  } catch (e) {
    handleError(e)
  }
})

function handleStream (stream) {
  const video = document.querySelector('video')
  console.log(video)
  video.srcObject = stream
  video.onloadedmetadata = (e) => video.play()

  // Create Media recorder...

    const options = { mimeType: 'video/webm; codecs=vp9' }
    mediaRecorder = new MediaRecorder(stream, options)
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

}

function handleDataAvailable(e) {
    recordedChunks.push(e.data);   
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer());

    ipcRenderer.send('save-dialog', buffer)

}

function handleError (e) {
  console.log(e)
}

contextBridge.exposeInMainWorld('electroApi', {
    sendRecord: (record) => {
        record.addEventListener('click', () => {
            console.log('started...', mediaRecorder)
            mediaRecorder.start();
        })
    },
    sendStop: (stop) => {
        stop.addEventListener('click', () => {
            console.log('stopped...', mediaRecorder)
            mediaRecorder.stop();
        })
    }

})