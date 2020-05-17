/* eslint-disable prettier/prettier */
import React, { Component } from 'react';
import { View, NativeModules, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { RtcEngine, AgoraView } from 'react-native-agora';
import RequestAndroidPermission from './RequestAndroidPermission';
const { Agora } = NativeModules;            //Define Agora object as a native module

const {
  FPS30,
  AudioProfileDefault,
  AudioScenarioDefault,
  Adaptative,
} = Agora;                                  //Set defaults for Stream

const config = {                            //Setting config of the app
  appid: '787b2d6b253a43f48eae8f3de89a2fee',               //Enter the App ID generated from the Agora Website
  channelProfile: 0,                        //Set channel profile as 0 for RTC
  videoEncoderConfig: {                     //Set Video feed encoder settings
    width: 720,
    height: 1080,
    bitrate: 1,
    frameRate: FPS30,
    orientationMode: Adaptative,
  },
  mode: 1,
  clientRole: 1,//only work in live mode, 1 is host, 2 is audience
  audioProfile: AudioProfileDefault,
  audioScenario: AudioScenarioDefault,
};

interface Props {
}
interface State {
  peerIds: number[];                                      //Array for storing connected peers
  uid: number;              //Generate a UID for local user
  appid: string;
  channelName: string;                       //Channel Name for the current session
  joinSucceed: boolean;
}

export class LiveView extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      peerIds: [],                                       //Array for storing connected peers
      uid: 1212112,              //Generate a UID for local user
      appid: config.appid,
      channelName: 'demoChannel',                        //Channel Name for the current session
      joinSucceed: false,                                //State variable for storing success
    };
    if (Platform.OS === 'android') {                    //Request required permissions from Android
      RequestAndroidPermission.requestCameraAndAudioPermission().then(_ => {
        console.log('requested!');
      });
    }
  }
  async componentDidMount() {

    // try {
    //   const granted = await PermissionsAndroid.requestMultiple([
    //     PermissionsAndroid.PERMISSIONS.CAMERA,
    //     PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    //   ]);
    //   if (
    //     granted['android.permission.RECORD_AUDIO'] ===
    //     PermissionsAndroid.RESULTS.GRANTED &&
    //     granted['android.permission.CAMERA'] ===
    //     PermissionsAndroid.RESULTS.GRANTED
    //   ) {
    //     console.log('You can use the cameras & mic');
    //   } else {
    //     console.log('Permission denied');
    //   }
    // } catch (err) {
    //   console.warn(err);
    // }
    RtcEngine.on('userJoined', (data) => {
      const { peerIds } = this.state;                   //Get currrent peer IDs
      if (peerIds.indexOf(data.uid) === -1) {           //If new user has joined
        this.setState({
          peerIds: [...peerIds, data.uid],              //add peer ID to state array
        }, () => {
          console.log('userJoined peerIds:' + this.state.peerIds);
        });
      }
    });
    RtcEngine.on('userOffline', (data) => {             //If user leaves
      this.setState({
        peerIds: this.state.peerIds.filter(uid => uid !== data.uid), //remove peer ID from state array
      }, () => {
        console.log('userOffline peerIds:' + this.state.peerIds);
      });
    });
    RtcEngine.on('joinChannelSuccess', (_data) => {                   //If Local user joins RTC channel
      RtcEngine.startPreview();                                      //Start RTC preview
      console.log('joinChannelSuccess:');
      this.setState({
        joinSucceed: true,                                           //Set state variable to true
      });
    });
    RtcEngine.init(config);                                         //Initialize the RTC engine
    this.startCall();
  }
  /**
  * @name startCall
  * @description Function to start the call
  */
  startCall = () => {
    console.log('startCall:');
    RtcEngine.joinChannel(this.state.channelName, this.state.uid);  //Join Channel
    // RtcEngine.enableAudio();
    RtcEngine.enableLocalAudio(true);
    RtcEngine.enableLocalVideo(true);
    RtcEngine.enableVideo();
    RtcEngine.setLocalRenderMode(1);
    RtcEngine.registerLocalUserAccount(this.state.uid + '');
    RtcEngine.setDefaultMuteAllRemoteVideoStreams(false);
    // RtcEngine.setClientRole(1);                                     //Enable the audio
  }
  /**
  * @name endCall
  * @description Function to end the call
  */
  endCall = () => {
    RtcEngine.leaveChannel();
    this.setState({
      peerIds: [],
      joinSucceed: false,
    });
  }
  render() {
    return (
      <View style={styles.max}>
        <AgoraView style={[styles.flex1]} zOrderMediaOverlay={false}
          remoteUid={1589515290} showLocalVideo={false} mode={1} />
        <View style={styles.buttonHolder}>
          <TouchableOpacity onPress={this.startCall} style={styles.button}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.endCall} style={styles.button}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        </View>
        {/* <AgoraView style={styles.localVideoStyle}
                    zOrderMediaOverlay={true} showLocalVideo={true} mode={1} /> */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  max: {
    flex: 1,
  },
  buttonHolder: {
    position: 'absolute',
    height: 100,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    left: 0,
    top: 0,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0093E9',
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
  },
  localVideoStyle: {
    width: 120,
    height: 150,
    position: 'absolute',
    bottom: 5,
    right: 5,
    zIndex: 100,
    backgroundColor: 'red',
},
flex1: {
    flex: 1,
  },
});
