//@ts-nocheck
import cookie from "js-cookie";
import {v4 as uuid} from '@lukeed/uuid'
import {appendStyle, loadStyle, rgbStrToHex} from "./utils";
import {loadScript} from "../../../lib/load-script";

const isShowLog = true
const endpoint = "https://uat.primedatacdp.com"
const eventStatusEnum = {
  delivered: "delivered", //on receive message
  viewed: "viewed", //onInit
  clicked: "clicked", //confirmAction
  visited: "visited", //confirmAction
  closed: "closed" //OK
}
let websocket = null
// Separator để ngăn cách phần event alias và event id trong button_event channel message lúc tạo collect lead popup
const SEPARATOR_PREFIX = "__PRIMEDATA_AI__";
export const initOnsiteSDKNotUsingSharedWorker = (opt: any, analytics: any) => {
  loadConfigPathfora(opt)
  isShowLog &&
  console.info('Logging::: initOnsiteSDKNotUsingSharedWorker Log::: ', opt)
  let client_id = sessionStorage.getItem('cdp_client_id')

  if (!client_id) {
    client_id = uuid()
    sessionStorage.setItem('cdp_client_id', client_id)
  }

  const storageConfig = {
    client_id: client_id,
    x_client_access_token: opt.writeKey,
    x_client_id: opt.source,
  }

  analytics.track('reached_channel', {
    onsite: {notification_token: client_id},
  })
  localStorage.setItem('posjs-profile', JSON.stringify(storageConfig))

  // const socketUrl = `wss://${opt.HOST}/ws/register/${client_id}/${opt.source}/${opt.writeKey}`
  const socketUrl = `wss://uat.primedatacdp.com/prile/ws/register/${client_id}/JS-2LUc0ox23E3ys5oj4n9Dcu2Daot/2LUc0qoFQMtl000aQoCn73gV9QU`

  // Open a connection. This is a common connection. This will be opened only once.
  const ws = new WebSocket(socketUrl)
  isShowLog && console.info('OS Logging:: Status ws: ', ws)
  // Let all connected contexts(tabs) know about state changes
  ws.onopen = () => {
    isShowLog && console.info('OS Logging:: Status onopen', ws)
    websocket=ws
  }
  ws.onclose = () => {
    isShowLog && console.info('OS Logging:: Status onclose', ws)
  }

  // When we receive data from the server.
  ws.onmessage = ({data}) => {
    isShowLog && console.log('OS Logging:: onmessage', data)
    // Construct object to be passed to handlers
    const parsedData = {data: JSON.parse(data), type: 'message'}
    if (!parsedData.data.from) {
      // Broadcast to all contexts(tabs). This is because no particular id was set on the from field here. We're using this field to identify which tab sent the message
      // bcChannel.postMessage(parsedData);
      console.log('initOnsiteSDKNotUsingSharedWorker log::47 onmessage ', parsedData)
      handleBroadcast(parsedData);
    } else {
      // Get the port to post to using the uuid, ie send to expected tab only.
      // idToPortMap[parsedData.data.from].postMessage(parsedData);
      console.log('log::51 onmessage else: ', parsedData)
    }
  }
}

export const loadConfigPathfora = (config: any) => {
  const css = `
  .pf-widget-headline {
    line-height: 35px;
  }

  @font-face {
      src: url("${config.endpoint}/fonts/Gilroy-Medium.woff2") format("woff2");
      font-display: swap;
      font-family: "Gilroy";
      font-style: normal;
      font-weight: 500;
  }
  @font-face {
      src: url("${config.endpoint}/fonts/Gilroy-Bold.woff2") format("woff2");
      font-display: swap;
      font-family: "Gilroy";
      font-style: normal;
      font-weight: 700;
  }
  @font-face {
      src: url("${config.endpoint}/fonts/Gilroy.woff2") format("woff2");
      font-display: swap;
      font-family: "Gilroy";
      font-style: normal;
      font-weight: 400;
  }
  @font-face {
      src: url("${config.endpoint}/fonts/Gilroy-Light.woff2") format("woff2");
      font-display: swap;
      font-family: "Gilroy";
      font-style: normal;
      font-weight: 300;
  }
  @font-face {
      font-family: "Gilroy";
      font-display: swap;
      font-style: normal;
      font-weight: bold;
      src: url("${config.endpoint}/fonts/SVN-Gilroy SemiBold.otf");
  }

  .primedata-cdp-popup-onsite-wrapper {
    font-family: Gilroy, "svgGilroy" !important;
  }
`;
  appendStyle(css);
  loadStyle(config.stylePathfora);
  loadScript(config.jsPathfora).then();
}

export const handleBroadcast = (data: any) => {
  console.info("OS Logging::: handleBroadcast Log::: ", data);
  let node = data?.data?.id ? document.getElementById(data.data.id) : null;
  if (!node) {

     console.info("ShowPopup - document.readyState: ", document.readyState);

    if (document.readyState === "complete") {
      const hasPopupShowing = localStorage.getItem("isPopupShowing");
      if (hasPopupShowing || hasPopupShowing === "true") {
        console.info("ShowPopup - Has popup showing - Break function");
        return;
      }
      console.info("OS Logging::: Show popup now: ", data, data?.data?.id);
      showPopupOnSite(data.data, data?.data?.id);
    }

  }
}

export const showPopupOnSite = (event: any, modalId: string) => {

  console.info("OS Logging::: showPopupOnSite Log::: ", event, modalId);
  isShowLog && console.log("OS Logging::: showPopupOnSite Log::: ", event);
  const eventParse = typeof event === "object" ? event?.data : JSON.parse(event?.data || "{}");
  const dataParse = JSON.parse(eventParse || "{}");
  isShowLog && console.log("OS Logging::: showPopupOnSite Popup Category Log::: ", dataParse?.category);
  if("POPUP_CATEGORY_THEME_STORE" === dataParse?.category) return showPopupTemplate(event, dataParse);

  const modalData = generatePathforaFormData(event);
  isShowLog && console.log("OS Logging::: modalData Log::: ", modalData);

  event.data = JSON.parse(event.data || "{}");

  if (event.data.type === "PRESENT_MESSAGE") {
    //@ts-ignore
    modalData.okShow = false;
    //@ts-ignore
    delete modalData.cta_button;
    //@ts-ignore
    delete modalData.confirmAction;
    //@ts-ignore
    delete modalData.okMessage;
    //@ts-ignore
    delete modalData.fields;
  }

  //@ts-ignore
  modalData.id = modalId;

  /*Check headline or message if contains double bracket then not show popup*/
  //@ts-ignore
  let isHasBracketCharacter = (modalData?.msg?.indexOf("{{") >= 0) || (modalData?.headline?.indexOf("{{") >= 0);
  if (isHasBracketCharacter) {
    isShowLog && console.log("OS Logging::: Not show popup because headline or message contains bracket => special character");
    return;
  }

  let messString = modalData?.msg || "";
  // not support in browser old version
  // messString = messString?.replaceAll("{{", "(");
  // messString = messString?.replaceAll("}}", ")");

  // support old version
  messString = messString?.split("{{")?.join("(");
  messString = messString?.split("}}")?.join(")");
  //@ts-ignore
  modalData.msg = messString;

  //@ts-ignore
  let headLineString = modalData?.headline || "";
  // not support in browser old version
  // headLineString = headLineString?.replaceAll("{{", "(");
  // headLineString = headLineString?.replaceAll("}}", ")");

  // support old version
  headLineString = headLineString?.split("{{")?.join("(");
  headLineString = headLineString?.split("}}")?.join(")");
  //@ts-ignore
  modalData.headline = headLineString;

  let modal;
  switch (event.data.type) {
    case "DRIVE_TRAFFIC" :
      // @ts-ignore
      modal = new pathfora.Message(modalData);
      break;
    case "COLLECT_LEADS" :
      // @ts-ignore
      modal = new pathfora.Form(modalData);
      break;
    case "PRESENT_MESSAGE" :
      // @ts-ignore
      modal = new pathfora.Message(modalData);
      break;
    default:
      modal = null;
      break;
  }

  isShowLog && console.log("OS Logging::: Pathfora Modal Data:: ", modal);


  if (modal) {
    //@ts-ignore
    window.pathfora.initializeWidgets([modal]);

    ackPopupForServer(event);
  }
}

export const generatePathforaFormData = (messageDataParam) => {
  const dataParse = typeof messageDataParam === "object" ? messageDataParam : JSON.parse(messageDataParam || "{}");
  isShowLog && console.log("OS Logging::: generatePathforaDetails Log::: ", dataParse);
  let data = {};
  let dataType = dataParse ? (dataParse.type || 0) : 0;
  switch (dataType) {
    case "DRIVE_TRAFFIC":
      isShowLog && console.log("DRIVE_TRAFFIC: ", dataParse);
      data = dataParse.drive_traffic;
      break;
    case "COLLECT_LEADS":
      isShowLog && console.log("COLLECT_LEADS: ", dataParse);
      data = dataParse.collect_leads;
      break;
    case "PRESENT_MESSAGE":
      isShowLog && console.log("PRESENT_MESSAGE: ", dataParse);
      data = dataParse.present_message;
      break;
    default:
      data = {};
      break;
  }

  const layoutSwitchCaseObj = {
    MESSAGE_LAYOUT_MODAL: "modal",
    MESSAGE_LAYOUT_SLIDE_OUT: "slideout",
    MESSAGE_LAYOUT_BAR: "bar",

    FORM_LAYOUT_MODAL: "modal",
    FORM_LAYOUT_SLIDE_OUT: "slideout",

    SUBSCRIPTION_LAYOUT_MODAL: "modal",
    SUBSCRIPTION_LAYOUT_SLIDE_OUT: "slideout",
    SUBSCRIPTION_LAYOUT_BAR: "bar"
  };

  const themeSwitchCaseObj = {
    "THEME_LIGHT": "light",
    "THEME_DARK": "dark",
    "THEME_CUSTOM": "custom"
  };

  const layoutType = data.layout ? (data.layout.type || "") : "";
  let layout = layoutSwitchCaseObj[layoutType] || layoutSwitchCaseObj.MESSAGE_LAYOUT_MODAL;

  let positionPopup = "top-fixed";
  if (layoutType === "MESSAGE_LAYOUT_BAR" || layoutType === "SUBSCRIPTION_LAYOUT_BAR") positionPopup = "top-absolute";

  if (layoutType === "MESSAGE_LAYOUT_SLIDE_OUT" || layoutType === "SUBSCRIPTION_LAYOUT_SLIDE_OUT" || layoutType === "FORM_LAYOUT_SLIDE_OUT") {
    positionPopup = data.layout.slide_out.position?.toLowerCase().replace("_", "-");
  }

  if (
    layoutType === "MESSAGE_LAYOUT_MODAL" ||
    layoutType === "SUBSCRIPTION_LAYOUT_MODAL" ||
    layoutType === "FORM_LAYOUT_MODAL"
  ) {
    positionPopup = "center";
  }

  let formElements = [];

  if (data?.form_element) {
    let fieldType = {
      CITY: "text",
      EMAIL: "email",
      FULL_NAME: "text",
      PHONE: "text",
      GENDER: "text",
      DOB: "text",
      CHECKBOX_GROUP: "text",
      RADIO_GROUP: "text",
      TEXTAREA: "text",
      TEXT: "text",
      SELECT: "text",
    };

    formElements = data.form_element.map((el) => ({
      ...el,
      placeholder: el?.label + (el?.required ? " (*)" : ""),
      label: "",
      type: fieldType[el.type] || "text",
      fieldType: el.type,
    }));
  }


  const messageId = dataParse ? (dataParse.id || "") : "";
  showingMessageId = messageId;

  let imageOnsite = layout === "slideout"
    ? data.layout?.slide_out?.image
    : layout === "modal"
      ? data.layout?.modal?.image
      : layout === "bar"
        ? data.layout?.bar?.image
        : data.layout?.collect_leads?.image;

  return {
    className: 'primedata-cdp-popup-onsite-wrapper',
    layout: layout,
    position: positionPopup,
    headline: data.headline || "",
    msg: data.msg || "",
    image: imageOnsite || "",
    variant: 2,
    okShow: ![null, undefined, "", "undefined", "null"].includes(data?.cta_button?.text),
    cancelShow: false,
    okMessage: data?.cta_button?.text,
    theme: themeSwitchCaseObj[data.theme],
    colors: {
      background: rgbStrToHex(data.color.background),
      text: rgbStrToHex(data.color.text),
      headline: rgbStrToHex(data.color.headline),
      close: rgbStrToHex(data.color.close),
      actionBackground: rgbStrToHex(data.cta_button.background_color),
      actionText: rgbStrToHex(data.cta_button.text_color)
    },
    formElements: formElements,
    displayConditions: {
      hideAfterAction: data.display_condition.hide_after_action
    },
    fields: {
      name: false,
      title: false,
      email: false,
      message: false,
      phone: false,
      company: false
    },
    confirmAction: {
      name: data?.cta_button?.text,
      callback: function (event, payload) {
        isShowLog && console.log("OS Logging::: campaign response status clicked");
        handleCampaignResponse(messageId, eventStatusEnum.clicked);

        isShowLog && console.log("OS Logging::: campaign response status visited");
        handleCampaignResponse(messageId, eventStatusEnum.visited);


        isShowLog && console.log("dataType: ", dataType, "Form element size: ", formElements.length)
        if(dataType === "COLLECT_LEADS" && formElements.length > 0 ){
          let eventCTAOfCollectLead = data?.cta_button?.button_event;
          let eventAlias = eventCTAOfCollectLead ? eventCTAOfCollectLead.split(SEPARATOR_PREFIX)?.[0] : "";
          trackEventCollectLeadForm(eventAlias, formElements, () => {
            data?.cta_button?.link && window.open(data.cta_button.link);
          });
        } else {
          data?.cta_button?.link && window.open(data.cta_button.link);
        }


      }
    },
    onInit: function (event, module) {
      isShowLog && console.log("OS Logging::: campaign response status viewed");
      handleCampaignResponse(messageId, eventStatusEnum.viewed);
    },
    onModalClose: function (event, payload) {
      localStorage.removeItem("isPopupShowing");
    },
    closeAction: {
      callback: function (event, payload) {
        isShowLog && console.log("OS Logging::: campaign response status closed");
        handleCampaignResponse(messageId, eventStatusEnum.closed);
      }
    }
  };

}

export const ackPopupForServer = (event) => {
  if ( websocket) {
    websocket.send(JSON.stringify({type: "ack", data: {id: event.id}}));
    localStorage.setItem("isPopupShowing", "true");
  }
}


export const handleCampaignResponse = (messageId, status) => {
  const request = endpoint + "/v1/message/response?content_type=web_popup" +
    "&message_id=" + messageId +
    "&status=" + status +
    "&session_id=" + cookie.get("XSessionId");
  isShowLog && console.log("OS Logging:: handleCampaignResponse", request);
  fetch(request, {method: "POST"}).then(response => {
    if (!response || response.status !== 200) throw response;
  }).catch(error => {
    isShowLog && console.error("ERROR: ", error);
  });
  if (status === eventStatusEnum.visited || status === eventStatusEnum.closed) {
    // sessionStorage.removeItem("posjs_modal_curr_id");
  }
}

export const trackEventCollectLeadForm = (eventAlias, forms, cb) => {

  const getValueByType = (value, type) => {
    switch (type) {
      case "string":
        return value;
      case "array":
        return [value];

      //TODO: handle trait type => implement common case
      case "number":
        return Number(value);
      case "boolean":
        return false;

      default:
        return value;
    }
  }

  let data = {}
  forms.forEach(element => {
    isShowLog && console.log('OS Logging::: Element Form: ', element)
    let valueInput = document.getElementById(element.fieldType)?.value || ""
    if(!valueInput) return;

    /**
     * refs: PDT-5493 Popup Collect Lead Properties
     * Handle compatible with before version. Before version not exist alias field & using fieldType to hardcode property
     */
    if(element?.alias && element?.data_type) {
      data[element.alias] = getValueByType(valueInput, element.data_type);
    } else {
      if(element.fieldType === "EMAIL") data.email = valueInput;
      if(element.fieldType === "PHONE") data.phone_number = valueInput;
      if(element.fieldType === "GENDER") data.gender = valueInput.toLowerCase().includes("nam") ? "Nam" : "Nữ";
      if(element.fieldType === "CITY") data.city = valueInput;
      if(element.fieldType === "FULL_NAME") data.full_name = valueInput;
      if(element.fieldType === "DOB") data.date_of_birth = valueInput;
    }
  })
  isShowLog && console.log("OS Logging::: Identify profile with data::: ", data);
  analytics.identify(uuid(), {...data}, null, () => {
    isShowLog && console.log("OS Logging::: Track event with alias::: ", eventAlias);
    eventAlias && analytics.track(eventAlias, {});
    cb && cb()
  });
}


export const showPopupTemplate = (event: any, eventBody: any) => {
  let popup = JSON.parse(eventBody?.theme_Store?.custom_store) || {}
  isShowLog && console.log("OS Logging::: showPopupOnSite Log popup data ::: ", popup);
  isShowLog && console.log("OS Logging::: showPopupOnSite Log body data event ::: ", eventBody);
  if(popup?.html) {
    const styleId = uuid();
    let onsite = {
      show: Function('"use strict";return (' + popup.html + ')')(),
      confirmAction:  function (_event: any, _payload: any) {
        isShowLog && console.log("OS Logging::: campaign response status clicked");
        handleCampaignResponse(eventBody.id, eventStatusEnum.clicked);

        isShowLog && console.log("OS Logging::: campaign response status visited");
        handleCampaignResponse(eventBody.id, eventStatusEnum.visited);

        let formElements = [];
        if (popup?.form_element) {
          let fieldType = {
            CITY: "text",
            EMAIL: "email",
            FULL_NAME: "text",
            PHONE: "text",
            GENDER: "text",
            DOB: "text",
            CHECKBOX_GROUP: "text",
            RADIO_GROUP: "text",
            TEXTAREA: "text",
            TEXT: "text",
            SELECT: "text",
          };

          formElements = popup.form_element.map((el: { label: string | number; required: any; type: string | number; }) => ({
            ...el,
            placeholder: el?.label + (el?.required ? " (*)" : ""),
            label: "",
            type: fieldType[el.type] || "text",
            fieldType: el.type,
            name: el.type,
          }));
        }

        isShowLog && console.log("Form element size: ", formElements.length)
        if( formElements.length > 0 ){
          let eventCTAOfCollectLead = popup?.cta_button?.button_event;
          let eventAlias = eventCTAOfCollectLead ? eventCTAOfCollectLead.split(SEPARATOR_PREFIX)?.[0] : "";
          trackEventCollectLeadForm(eventAlias, formElements, () => {
            localStorage.removeItem("isPopupShowing");
            popup?.cta_button?.link && window.open(popup.cta_button.link);
          });
        } else {
          localStorage.removeItem("isPopupShowing");
          popup?.cta_button?.link && window.open(popup.cta_button.link);
        }

      },
      closeAction: function (_event, _payload) {
        localStorage.removeItem("isPopupShowing");
        isShowLog && console.log("OS Logging::: campaign response status closed");
        handleCampaignResponse(eventBody.id, eventStatusEnum.closed);
        styleId && document.getElementById(styleId)?.remove();
      }
    }
    isShowLog && console.log("OS Logging::: campaign response status viewed");
    handleCampaignResponse(eventBody.id, eventStatusEnum.viewed);
    isShowLog && console.log("OS Logging::: showPopupOnSite template show success!");
    ackPopupForServer(event);
    return onsite.show({...popup, styleId: styleId}, onsite.confirmAction, onsite.closeAction);
  } else {
    isShowLog && console.log("OS Logging::: showPopupOnSite template broken => not show::: ");
  }
}
