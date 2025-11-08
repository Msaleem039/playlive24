import { SplitApiSettings } from "../services/SplitApiSetting";
import { cricketApi } from "../services/CricketApi";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import websocketReducer from "./slices/websocketSlice";

// Create the root reducer without persist
const rootReducer = {
  auth: authReducer,
  websocket: websocketReducer,
  [SplitApiSettings.reducerPath]: SplitApiSettings.reducer,
  [cricketApi.reducerPath]: cricketApi.reducer,
};

// Configure the store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(SplitApiSettings.middleware, cricketApi.middleware),
});

export { store };
