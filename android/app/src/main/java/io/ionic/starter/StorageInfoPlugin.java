package io.ionic.starter;

import android.os.Environment;
import android.os.StatFs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StorageInfo")
public class StorageInfoPlugin extends Plugin {
    @PluginMethod
    public void getStorageInfo(PluginCall call) {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        JSObject result = new JSObject();

        result.put("availableBytes", stat.getAvailableBytes());
        result.put("freeBytes", stat.getFreeBytes());
        result.put("totalBytes", stat.getTotalBytes());

        call.resolve(result);
    }
}
