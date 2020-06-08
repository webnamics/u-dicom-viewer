<div align="center">
  <h1>U Dicom Viewer</h1>
  <p>A simple web browser DICOM viewer for any device.</p>
</div>

<div align="center">
	<a href="https://webnamics.github.io/u-dicom-viewer/">Online version</a>
</div>

<hr />
<p>This software can only be used as a reviewing or scientific software and cannot be used as a medical device for primary diagnostic or any other clinical practice.</p>

<p><strong>U Dicom Viewer</strong> or <strong>UDV</strong> is a simple but functional DICOM viewer for any device with a web browser, it allows to open and view 2D medical images in a wide variety of DICOM formats.</p>

<h2><a id="user-content-acknowledgments" class="anchor" aria-hidden="true" href="#acknowledgments"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Key features</h2>
<ul>
	<li>Integration of a sandbox file manager to handle easily files and subfolders. (1)</li>
	<li>Open zip archive from local and decompress it into sandbox file system.</li>
	<li>Open zip archive from URL and decompress it into sandbox file system.</li>
	<li>Open images from sandbox file system.</li>
	<li>Open DICOMDIR from sandbox file system.</li>
	<li>Open DICOMDIR file from local (2).</li> 
	<li>Open multiple files from local folder (2).</li> 
	<li>Open medical images in DICOM format from local and URL.</li> 
	<li>Open images in JPEG or PNG format from local and URL.</li> 
	<li>Export zip archive of images from sandbox file system.</li> 
	<li>Window width and window center control for DICOM images.</li>
	<li>Zooming and panning images.</li> 
	<li>Measurement tools with annotation field.</li>
	<li>Measurement tools for length, area and angle, elliptical, rectangle and Freehand ROI.</li>
	<li>Persistence of measurement tools. (3)</li>
	<li>Cine view with control functions for multiframe image.</li>
	<li>Displaying DICOM attributes of image.</li>
	<li>Multi-view support, it can open up to 16 different files (1x1 to 4x4 grid).</li>
	<li>Basic 2D Multiplanar Reconstruction (MPR), this allows to reconstruct images in orthogonal planes (coronal, sagittal, axial).</li>
	<li>Reference Lines, this allows to determine the intersection point when browsing series with different image planes.</li>
	<li>Link Series, this allows to syncronized scroll with different series on same slice location.</li>
	<li>Browser to explorer series and images.</li>
	<li>Histogram window.</li>
	<li>Save DICOM attributes as JSON or CSV file.</li>
	<li>Save screenshot in JPEG or PNG format into local or sandbox file system.</li>
</ul>

<div>
	<p>(1) Stored in IndexedDB, the client-side database of web browser.</p>
	<p>(2) This feature is not present in mobile browser because the webkitdirectory attribute is not yet supported (for detail see <a href="https://caniuse.com/#feat=input-file-directory">caniuse.com/#feat=input-file-directory</a>).</p>
	<p>(3) Stored in IndexedDB. In the database every measurement is associated with SOP Instance UID tag.</p>
</div>

<h2><a id="user-content-acknowledgments" class="anchor" aria-hidden="true" href="#acknowledgments"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>Acknowledgments</h2>
<p>UDV uses:</p>
<ul>
	<li><a href="https://github.com/cornerstonejs/cornerstone">Cornerstone Core</a>, complete web based medical imaging platform.</li>
	<li><a href="https://github.com/cornerstonejs/cornerstoneTools">CornerstoneTools</a>, library of common tools that can be used with Cornerstone.</li>
	<li><a href="https://github.com/webnamics/cornerstoneWADOImageLoader">webnamics/CornerstoneWADOImageLoader</a>, Cornerstone Image Loader that works with WADO-URI, WADO-RS and DICOM P10 files. A fork that allow to load image from ArrayBuffer.</li>
	<li><a href="https://github.com/cornerstonejs/cornerstoneWebImageLoader">CornerstoneWebImageLoader</a>, Cornerstone Image Loader that works with PNG and JPEG files.</li>
	<li><a href="https://github.com/webnamics/cornerstoneFileImageLoader">CornerstoneFileImageLoader</a>, Cornerstone Image Loader for images (JPG, PNG) using the HTML5 File API.</li>
	<li><a href="https://github.com/cornerstonejs/dicomParser">dicomParser</a>, JavaScript library designed to parse DICOM for web browsers.</li>
	<li><a href="https://github.com/rii-mango/Daikon">Daikon</a>, pure JavaScript DICOM reader.</li>
</ul>
<p>As well as the following third-party libraries:</p>
<ul>
	<li><a href="https://github.com/dfahlander/Dexie.js/">Dexie.js</a>, wrapper library for indexedDB - the standard database in the browser.</li>
	<li><a href="https://github.com/duskload/react-device-detect">react-device-detect</a>, detect device, and render view according to detected device type.</li>
	<li><a href="https://material-ui.com/">Material-UI</a>, React components for faster and easier web development. Build your own design system, or start with Material Design.</li>
	<li><a href="https://github.com/hammerjs/hammer.js/tree/master">hammer.js</a>, JavaScript library for detecting touch gestures.</li>
	<li><a href="https://github.com/axios/axios">axios</a>, Promise based HTTP client for the browser and node.js.</li>
	<li><a href="https://github.com/Stuk/jszip">JSZip</a>, Create, read and edit .zip files with Javascript.</li>
	<li><a href="https://github.com/goldenyz/react-perfect-scrollbar">React-Perfect-Scrollbar</a>, Wrapper to allow use perfect-scrollbar in React.</li>
</ul>


<hr />

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

## Copyright

Copyright 2019 Luigi Orso [webnamics@gmail.com](mailto:webnamics@gmail.com)
