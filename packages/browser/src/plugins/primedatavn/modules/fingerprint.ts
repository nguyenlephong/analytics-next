// @ts-nocheck
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import {deviceStorage} from "./storage";

const DEVICE_ID_STORAGE_KEY = "primedata_device_id"
const DEVICE_INFO_STORAGE_KEY = "primedata_device_info"

//https://www.npmjs.com/package/@fingerprintjs/fingerprintjs
const setupFingerprintJS = async () => {
  let fingerprintPromise;
  /**
   * Implement step
   * - Khi init context => check storage => có data primedata_device_id không?
   * + Nếu có => đi tiếp đến bước builder / Đồng thời gọi init fingerprintjs để setup luồng track event debugging
   * + Nếu không có => đợi init xong vụ fingerprint => đi tiếp flow init context
   */
  // Initialize the agent at follower loaded.
  if (!fingerprintPromise) fingerprintPromise = FingerprintJS.load({storageKey: "fingerprint"})
  console.log('log::20 setupFingerprintJS', fingerprintPromise)
  try {
    // Get the fingerprint object when you need it.
    const fp = await fingerprintPromise
    const fingerprint = await fp.get()
    console.info("This is the visitor identifier:", fingerprint.visitorId);
    const deviceId = await getDeviceIdFromStorage();
    if (!deviceId) {
      saveDeviceInfoToStorage(fingerprint);
      window._primedata_fingerprint = fingerprint;
      return fingerprint;
    }

    const deviceInfo = await getDeviceInfoFromStorage();
    if (!deviceInfo) return fingerprint;

    const deviceProperty = {
      "existed_device_id": deviceId,
      "existed_device_id_confidence_score": deviceInfo.confidence.score.toString(),
      "existed_device_id_created_at": deviceInfo.created_at.toString(),
      "existed_device_id_ip_address": "",
      "existed_device_id_lib_version": deviceInfo.version,
      "existed_device_id_user_agent": deviceInfo.userAgent.toString(),
      "new_device_id": fingerprint.visitorId,
      "new_device_id_confidence_score": fingerprint.confidence.score.toString(),
      "new_device_id_created_at": new Date().getTime().toString(),
      "new_device_id_ip_address": "",
      "new_device_id_lib_version": fingerprint.version,
      "new_device_id_user_agent": window?.navigator?.userAgent?.toString()
    }

    /**
     * - Trong lúc init fingerprint thành công => check device_id mới và storage current
     * + Nếu match => send event fb_device_id_matched
     * + Nếu không match => send event fb_device_id_not_matched
     */
    if (deviceId === fingerprint.visitorId) {
      delete deviceProperty.new_device_id;
      analytics.track("fp_device_id_matched", {
        "properties": deviceProperty
      });
    }

    if (deviceId !== fingerprint.visitorId) {
      analytics.track("fp_device_id_not_matched", {
        "properties": deviceProperty
      });
    }

    return fingerprint;
  } catch (error) {
    console.log('log::72 setupFingerprintJS: error: ', error)
    switch (error.message) {
      case FingerprintJS.ERROR_GENERAL_SERVER_FAILURE:
        console.error("Unknown server error. Request id:", error.requestId);
        break;
      case FingerprintJS.ERROR_CLIENT_TIMEOUT:
        console.error("Identification time limit of 10 seconds is exceeded");
        break;
      default:
        console.error("Other error", error);
    }
  }

}

const getDeviceInfoFromStorage = () => {
  return deviceStorage.getItem(DEVICE_INFO_STORAGE_KEY);
}

const getDeviceIdFromStorage = () => {
  return deviceStorage.getItem(DEVICE_ID_STORAGE_KEY);
}

const saveDeviceInfoToStorage = (fingerData) => {
  if (!fingerData) return;
  fingerData.created_at = new Date().getTime();
  fingerData.userAgent = window?.navigator?.userAgent;

  deviceStorage.setItem(DEVICE_ID_STORAGE_KEY, fingerData.visitorId);
  deviceStorage.setItem(DEVICE_INFO_STORAGE_KEY, fingerData);
}

const initFingerprint = async () => {
  console.log('log::106 initFingerprint',)
  /**
   * - Khi init context => check storage => có data primedata_device_id không?
   * + Nếu có => đi tiếp đến bước builder / Đồng thời gọi init fingerprintjs để setup luồng track event debugging
   * + Nếu không có => đợi init xong vụ fingerprint => đi tiếp flow init context
   */
  const deviceId = await getDeviceIdFromStorage();
  if (!deviceId) await setupFingerprintJS();
  else await setupFingerprintJS();
}

export {
  initFingerprint,
  getDeviceInfoFromStorage,
  getDeviceIdFromStorage
}
