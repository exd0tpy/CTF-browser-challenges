#!/bin/sh

# Needs to be run from the root of the v8 directory
gn gen out/kit_engine --args='v8_use_external_startup_data=false is_component_build=false target_cpu="x64" v8_monolithic=true is_debug=true symbol_level=2'

ninja -j 1 -C ./out/kit_engine d8 
