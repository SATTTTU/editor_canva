"use client"

import { configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import editorReducer from './editorSlice'

const persistConfig = {
  key: 'root',
  storage,
  // Blacklist non-serializable state like stageRef
  blacklist: ['stageRef']
}

const persistedReducer = persistReducer(persistConfig, editorReducer)

export const store = configureStore({
  reducer: {
    editor: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these actions and paths in the serializable check
        ignoredActions: [
          'editor/setStageRef',
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER
        ],
        ignoredPaths: ['editor.stageRef'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch