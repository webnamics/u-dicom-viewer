import React from "react";
import App from "./App";
// import WebFontLoader from "webfontloader";
import { Provider } from "react-redux";
import store from "./store";
// import { MuiThemeProvider, createTheme } from "@material-ui/core/styles";
import ReactDOM from "react-dom";
// WebFontLoader.load({
//     google: {
//         families: ["Roboto:300,400,500,700", "Material Icons"],
//     },
// });

//store.subscribe(() => console.log('store updated:', store.getState()));

// const theme = createTheme({
//     overrides: {
//         MuiFormControlLabel: {
//             label: {
//                 fontSize: "0.85em",
//             },
//         },
//         MuiFormLabel: {
//             root: {
//                 "&$focused": {
//                     color: "#CCCCCC",
//                 },
//             },
//         },
//     },
//     palette: {
//         primary: {
//             main: "#004d40",
//         },
//         secondary: {
//             main: "#888888",
//         },
//         type: "dark",
//     },
// });
const Index = (props) => {
    return (
        <Provider store={store}>
            {/* <MuiThemeProvider theme={theme}> */}
                <App {...props} />
            {/* </MuiThemeProvider> */}
        </Provider>
    );
};
export default Index;
ReactDOM.render(<Index/>, document.getElementById("root"));
