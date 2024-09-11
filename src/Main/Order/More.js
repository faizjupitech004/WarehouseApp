//import libraries
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from "react-native-vector-icons/Ionicons";
import Footer from './footer';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Helper functions for dimension calculations
const calculateHeightPercentage = percentage => (windowHeight * percentage) / 100;
const calculateWidthPercentage = percentage => (windowWidth * percentage) / 100;
const calculateFontSizePercentage = percentage => {
    const baseDimension = Math.min(windowWidth, windowHeight);
    return (baseDimension * percentage) / 100;
};

// create the More component
const More = ({ navigation }) => {
    return (
        <SafeAreaView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ padding: calculateFontSizePercentage(10) }}>
                    <TouchableOpacity style={{ height: calculateHeightPercentage(10), width: calculateWidthPercentage(20), backgroundColor: 'red', alignItems: 'center', justifyContent: 'center', borderRadius: calculateFontSizePercentage(2), elevation: 5 }}
                        onPress={() => { navigation.navigate('Return Invoice') }}
                    >
                        <Text style={{ color: 'white', fontSize: calculateFontSizePercentage(4), textAlign: 'center' }}>Return Order</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ padding: calculateFontSizePercentage(10) }}>
                    <TouchableOpacity style={{ height: calculateHeightPercentage(10), width: calculateWidthPercentage(20), backgroundColor: 'red', alignItems: 'center', justifyContent: 'center', borderRadius: calculateFontSizePercentage(2), elevation: 5 }}
                        onPress={() => { navigation.navigate('History') }}
                    >
                        <Text style={{ color: 'white', fontSize: calculateFontSizePercentage(4), textAlign: 'center' }}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.footer}>
                <Footer navigation={navigation} />
            </View>
        </SafeAreaView>
    );
};

// define your styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        textAlign: 'center',
        paddingVertical: calculateHeightPercentage(2.2),
    },
    headerText: {
        marginLeft: calculateWidthPercentage(5),
        marginTop: calculateHeightPercentage(-0.5),
        fontSize: calculateFontSizePercentage(5),
        color: 'black',
        fontWeight: 'bold'
    },
    footer: {
        // backgroundColor: "red",
        position: 'absolute',
        height: "10%",
        alignItems: "center",
        top: calculateHeightPercentage(88)
    },
    footerText: {
        // color: "white",
        fontSize: calculateFontSizePercentage(5),
    },
});

export default More;