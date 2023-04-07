import React from "react";
import App from "./App";
import WebFontLoader from "webfontloader";
import { Provider } from "react-redux";
import store from "./store";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";

WebFontLoader.load({
    google: {
        families: ["Roboto:300,400,500,700", "Material Icons"],
    },
});

//store.subscribe(() => console.log('store updated:', store.getState()));

const theme = createMuiTheme({
    overrides: {
        MuiFormControlLabel: {
            label: {
                fontSize: "0.85em",
            },
        },
        MuiFormLabel: {
            root: {
                "&$focused": {
                    color: "#CCCCCC",
                },
            },
        },
    },
    palette: {
        primary: {
            main: "#004d40",
        },
        secondary: {
            main: "#888888",
        },
        type: "dark",
    },
});
const Index = ({ files }) => {
    return (
        <Provider store={store}>
            <MuiThemeProvider theme={theme}>
                <App files={files} />
            </MuiThemeProvider>
        </Provider>
    );
};
export default Index;
