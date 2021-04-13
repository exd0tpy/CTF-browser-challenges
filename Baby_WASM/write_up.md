# Baby WASM

### Note
> This challenge has unintened solution.  
Using `read`, `import` and using 1-day `CVE-2020-16040`.   
Actually this write up is same as Teen WASM.

### description
>This is a JS engine pwn challenge.  
V8 version: 8.7.220  
V8 commit: 0d81cd72688512abcbe1601015baee390c484a6a  
glibc version: 2.31  
OS: Ubuntu 20.04.2 - 64 bit  
Provided challenge files: V8 debug and release builds, diff and patch files, challenge setup files, libc.so.6  
The server will be running the release build.  
Note: My intended solution is not only about 90% reliable so if you are sure it has worked locally, in debug or release, but cannot get it to work remotely, please try to run your exploit many more times. Please talk to me if you think there is an issue.
Give us a link to your exploit and we will run it like `./d8 <file.js>`
Note: If you execute `/bin/sh` the runner will try to print flag for you. If you go any other ways and it works locally but not remotely, please talk to me.  
`nc challenges1.ritsec.club 1337`  
Download Link: https://drive.google.com/file/d/11OSPsOZY_MwarKDeaLNCsilSiD-70ztq/view?usp=sharing  
Author: @fpasswd on Discord, @flyingpassword on Twitter  

### v8.patch

```diff
 // WebAssembly.Memory.buffer -> ArrayBuffer
 void WebAssemblyMemoryGetBuffer(
     const v8::FunctionCallbackInfo<v8::Value>& args) {
@@ -2194,6 +2218,7 @@ void WasmJs::Install(Isolate* isolate, bool exposed_on_global_object) {
       i::WASM_MEMORY_OBJECT_TYPE, WasmMemoryObject::kHeaderSize);
   JSFunction::SetInitialMap(memory_constructor, memory_map, memory_proto);
   InstallFunc(isolate, memory_proto, "grow", WebAssemblyMemoryGrow, 1);
+  InstallFunc(isolate, memory_proto, "shrink", WebAssemblyMemoryShrink, 1);
   InstallGetter(isolate, memory_proto, "buffer", WebAssemblyMemoryGetBuffer);
   if (enabled_features.has_type_reflection()) {
     InstallFunc(isolate, memory_constructor, "type", WebAssemblyMemoryType, 1);
```
You can find `shrink` function is install at `WebAssembly.Memory`  


Using like this.
```V8 version 8.7.220
d8> var memory = new WebAssembly.Memory({initial:1, maximum: 10});
undefined
d8> memory.shrink(1);
65536
```

Important part is at `/src/objects/backing-store.cc`
```diff
diff --git a/src/objects/backing-store.cc b/src/objects/backing-store.cc
index c67fff0fa9..a2a277a77b 100644
--- a/src/objects/backing-store.cc
+++ b/src/objects/backing-store.cc
@@ -474,6 +474,30 @@ std::unique_ptr<BackingStore> BackingStore::CopyWasmMemory(Isolate* isolate,
   return new_backing_store;
 }

+std::unique_ptr<BackingStore> BackingStore::CopyWasmMemoryOnShrink(Isolate* isolate,
+                                                           size_t new_size) {
+
+  if (is_wasm_memory_) {
+    BackingStore::ShrinkWasmMemoryInPlace(isolate, this->byte_length() - new_size);
+    auto new_backing_store = BackingStore::Allocate(
+        isolate, new_size,
+        is_shared() ? SharedFlag::kShared : SharedFlag::kNotShared,
+        InitializedFlag::kUninitialized);
+    if (!new_backing_store) {
+      return {};
+    }
+
+    return new_backing_store;
+  } else {
+    bool result = BackingStore::Reallocate(isolate, new_size);
+    if (!result) {
+      return {};
+    }
+  }
+
+  return std::unique_ptr<BackingStore>(this);
+}
+
```
`CopyWasmMemoryOnShrink` allocates `BackingStore`.  
According to [src/objects/backing-store.cc](https://github.com/v8/v8/blob/3a407f7b2b7e6d2c451f79048590b788dae19972/src/objects/backing-store.cc#L212) BackingStore::Allocate's 4th argument is `InitializedFlag`

Our patch is using kUninitialized flag.  
So allocated memory can contain main arena's address.  

```javascript
memory.shrink(1); //insert 0x70 chunk to tcache 
var b = memory.buffer;
var view = new DataView(b);
memory.shrink(1); //get 0x70 chunk from tcache and insert previous chunk
```
After shrink, free `BackingStore`.  
but we can set and get with pre-defined `view`.  
(ex. we can access freed chunk with `view.getFloat64` and `view.setFloat64`)  
So it leads to UAF.

We leak libc address with uninitialized chunk data.  
After leak libc, corrupt tcache fd pointer with `__free_hook` or some other hook area.  
Allocate chunk with `memory.shrink(0x10000-0x60)` and overwrite `hook` area!.  
Pwn!  
