//import liraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CustomerApi, CustomerBaseUrl } from '../../Config/BaseUtil';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Helper functions for dimension calculations
const calculateHeightPercentage = percentage => (windowHeight * percentage) / 100;
const calculateWidthPercentage = percentage => (windowWidth * percentage) / 100;
const calculateFontSizePercentage = percentage => {
    const baseDimension = Math.min(windowWidth, windowHeight);
    return (baseDimension * percentage) / 100;
};

// create a component
const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [IsSecureEntry, setIsSecureEntery] = useState(true)

    const handleLogin = async () => {
        console.log("Email :- ", email)
        console.log("Password :- ", password)

        // salesone@gmail.com  123456
        // if (email && password) {
            await axios.post(`${CustomerBaseUrl}warehouse/signin`,
                {
                    "Username": email,
                    "Password": password
                },
            )
                .then(async(res) => {
                    // console.log("Response data:", res?.data?.message);
                    console.log("Response data:", res?.data?.warehouse?.database);
                    console.log("Response data:", res?.data?.warehouse?._id);
                    await AsyncStorage.setItem('LoginData', JSON.stringify(res?.data?.warehouse));
                    navigation.navigate('Sales Invoice');
                })
                .catch((err) => {
                    console.log(err?.response?.data?.message);
                    Alert.alert("Error!!!", err?.response?.data?.message)
                })
        // }
        // else {
        //     Alert.alert("Error!!!", "Please enter email and password");
        // }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Image
                    source={require('../../assets/LoginLogo.png')}
                    style={styles.lottieAnimation}
                    resizeMode='cover'
                />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginTop: calculateHeightPercentage(1), width: calculateWidthPercentage(85) }}>

                    <Text style={{ fontSize: calculateFontSizePercentage(4), marginBottom: calculateHeightPercentage(-1), marginLeft: calculateWidthPercentage(1), marginTop: calculateHeightPercentage(2), color: '#8a8a8a' }}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your Email here !!"
                        onChangeText={e => setEmail(e)}
                        value={email}
                        keyboardType='email-address'
                    />
                    <Text style={{ fontSize: calculateFontSizePercentage(4), marginBottom: calculateHeightPercentage(-1), marginLeft: calculateWidthPercentage(1), marginTop: calculateHeightPercentage(2), color: '#8a8a8a' }}>Password</Text>
                    <View style={styles.input}>
                        <TextInput
                            style={{ width: '90%', color: 'black' }}
                            placeholderTextColor={'gray'}
                            placeholder="Enter your Password here!!"
                            onChangeText={text => setPassword(text)}
                            value={password}
                            secureTextEntry={IsSecureEntry}
                        />
                        <TouchableOpacity
                            style={{
                                width: calculateWidthPercentage(20)
                            }}
                            onPress={() => {
                                setIsSecureEntery(!IsSecureEntry)
                            }}>
                            <Icon name={IsSecureEntry === false ? 'eye' : 'eye-off'} size={23} color='black' />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleLogin} style={styles.button}>
                        <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// define your styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: calculateHeightPercentage(10),
        alignItems: 'center',
    },
    input: {
        paddingHorizontal: calculateWidthPercentage(5),
        flexDirection: 'row',
        height: calculateHeightPercentage(6),
        borderColor: 'black',
        borderRadius: calculateFontSizePercentage(2),
        alignItems: 'center',
        backgroundColor: "#f0f0f0",
        borderColor: '#e0e0e5',
        borderWidth: 1,
        elevation: 2,
        marginTop: calculateHeightPercentage(1),
    },
    modalinput: {
        height: calculateHeightPercentage(6),
        width: calculateWidthPercentage(80),
        borderWidth: calculateWidthPercentage(0.2),
        marginBottom: calculateHeightPercentage(3),
        // padding: calculateFontSizePercentage(3),
        borderRadius: calculateFontSizePercentage(1),
    },
    button: {
        backgroundColor: '#EAAA13',
        paddingVertical: calculateHeightPercentage(1),
        marginTop: calculateHeightPercentage(4),
        borderRadius: calculateFontSizePercentage(10),
        width: "100%",
        alignSelf: 'center',
        elevation: 5,
        marginBottom: calculateHeightPercentage(1)
    },
    buttonText: {
        fontSize: calculateFontSizePercentage(5),
        color: 'white',
        textAlign: 'center',
        fontWeight: '650'
    },
    lottieAnimation: {
        // marginTop: calculateHeightPercentage(-15),
        height: calculateHeightPercentage(30),
        width: calculateWidthPercentage(70),

    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        // width: calculateHeightPercentage(40),
        paddingHorizontal: calculateWidthPercentage(5),
    },
    modalContent: {
        paddingHorizontal: calculateWidthPercentage(5),
        height: calculateHeightPercentage(30),
        backgroundColor: 'white',
        opacity: 1,
        padding: calculateFontSizePercentage(10),
        borderRadius: 10,
        elevation: 5,
    },
    modalCloseButton: {
        marginTop: calculateHeightPercentage(-4),
        // marginRight: calculateWidthPercentage(0),
        borderRadius: 5,
        alignSelf: 'flex-end',
    },
    errorText: {
        color: 'red',
        marginTop: calculateHeightPercentage(-2),
        marginBottom: calculateHeightPercentage(2),
        alignSelf: 'flex-start',
        paddingHorizontal: calculateWidthPercentage(1),
    },
});

//make this component available to the app
export default LoginScreen;
