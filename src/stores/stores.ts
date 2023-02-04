import defaultValue from "../util/defaultValue";
import { writable, type Writable } from "svelte/store";
import { browser } from "$app/environment";

// @ts-ignore
export const collection: Writable<Collection> = writable((browser ? JSON.parse(localStorage.getItem('collection')) : null) ?? defaultValue);
if (typeof window !== 'undefined') collection.subscribe((value) => { localStorage.collection = JSON.stringify(value); });