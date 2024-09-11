import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList, RefreshControl, Modal, Image, Linking } from 'react-native';
import { Card } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, Row } from "react-native-table-component";
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomerApi, CustomerBaseUrl } from '../../../Config/BaseUtil';
import moment from 'moment';
import Footer from './footer';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const calculateHeightPercentage = (percentage) => (windowHeight * percentage) / 100;
const calculateWidthPercentage = (percentage) => (windowWidth * percentage) / 100;
const calculateFontSizePercentage = (percentage) => {
    const baseDimension = Math.min(windowWidth, windowHeight);
    return (baseDimension * percentage) / 100;
};

export const Sales_Invoice_List = ({ navigation }) => {
    const [productData, setProductData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredProductData, setFilteredProductData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [refresh, setRefresh] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [LoginId, setLoginId] = useState('');

    // Dispatch
    const [isDeliverModalVisible, setDeliverModalVisible] = useState(false);

    const [OTP2, setOTP2] = useState();
    const [OTPError2, setOTPError2] = useState('');

    // Data for cancle
    const [selectedItem, setSelectedItem] = useState(null);


    const GetProduct = useCallback(async () => {
        try {
            const FullLoginData = await AsyncStorage.getItem('LoginData');
            const LoginData = JSON.parse(FullLoginData);
            console.log("LoginData :- ", LoginData?._id)
            setLoginId(LoginData?._id);

            setIsLoading(true);

            const response = await axios.get(`${CustomerBaseUrl}good-dispatch/view-order-warehouse/${LoginData?._id}`);

            const filteredOrderList = response?.data?.Order
                ?.filter(order =>
                    order.status === "Billing" &&
                    order.orderItems?.some(item => item.warehouse === LoginData?._id)
                ) || [];

            console.log("Filtered Order List 1111111111111 :- ", filteredOrderList);

            // Set the filtered data in both states
            setProductData(filteredOrderList);
            setFilteredProductData(filteredOrderList);
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    }, [setProductData, setFilteredProductData, setIsLoading, setLoginId]);


    useLayoutEffect(() => {
        GetProduct();
    }, [GetProduct]);
    useEffect(() => {
        GetProduct();
    }, [GetProduct]);


    const toggleProductExpansion = (index) => {
        setExpandedIndex(prevIndex => prevIndex === index ? null : index);
    };

    const DeliverProduct = async (item) => {
        console.log("Cancel :- ", item);
        setSelectedItem(item);
        setDeliverModalVisible(true);
    }

    const handleDeliver = async () => {
        console.log("NoOfPackage :- ", OTP2);
        console.log("warehouse LoginId :- ", LoginId);
        console.log("selectedItem  :- ", selectedItem?._id);

        if (!OTP2.trim()) {
            setOTPError2('Please enter your Package quantity.')
        }
        else {
            try {
                await axios.post(`${CustomerBaseUrl}order/order-dispatch/${selectedItem?._id}`,
                    {
                        warehouse: LoginId,
                        NoOfPackage: Number(OTP2)
                    }
                )
                    .then((res) => {
                        console.log(res?.data?.message);
                        Alert.alert("Successfull...", res?.data?.message)
                        
                        GetProduct();
                        setDeliverModalVisible(false);
                    })
                    .catch((err) => {
                        console.log("ERROR ;- ".err?.response?.data)
                    })
            } catch (error) {
                console.log(error?.response?.data?.error);
                setOTPError2(error?.response?.data?.error);
            }
        }

        setOTP2('');
    }

    const pullMe = () => {
        setRefresh(true);
        setTimeout(() => {
            GetProduct()
            setRefresh(false);
        }, 1000)
    }

    const handleLogout = async () => {
        try {
            setLoginId('');
            console.log(LoginId);
            await AsyncStorage.removeItem('LoginData');
            const data = await AsyncStorage.getItem('LoginData');
            if (data === null || LoginId === '') {
                navigation.navigate('Login');
            } else {
                console.error('Failed to remove LoginData');
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleSearch = useCallback((text) => {
        const keywords = text.trim().toUpperCase().split(/\s+/);
        const matchesSearch = (product, keywords) => {
            const title = product.partyId?.CompanyName.toUpperCase();
            return keywords.every(keyword => {
                return title.includes(keyword);
            });
        };
        const filtered = productData.filter(item => {
            return matchesSearch(item, keywords) &&
                (selectedCategory === 'All' || item.category.to() === selectedCategory.toLowerCase());

        });

        setFilteredProductData(filtered);
    }, [productData, selectedCategory]);

    const renderProductItem = useCallback((item, index) => {
        console.log(LoginId);
        // Prepare the table data from orderItems
        const tableHead = ['Product Name', 'Quantity', 'Total'];
        const tableData = item.orderItems.filter(Ele => Ele.warehouse === LoginId)
            .map(ele => [
                ele?.productId?.Product_Title?.toUpperCase() || 'N/A',
                ele?.qty || 'N/A',
                ele?.grandTotal || 'N/A',
            ]) || []

        return (
            <Card key={item.id} style={styles.card}>
                <Card.Content style={styles.content}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.title} numberOfLines={3}>
                            {item?.partyId?.CompanyName?.toUpperCase()}
                        </Text>
                        <Text style={styles.quantity} numberOfLines={3}>
                            Address: {item?.partyId?.address}
                        </Text>
                        <Text style={{
                            color: 'black',
                            fontSize: calculateFontSizePercentage(3),
                            marginVertical: calculateHeightPercentage(0.1),
                        }} numberOfLines={3}>
                            Contact: {item?.partyId?.mobileNumber}
                        </Text>
                        <Text style={{
                            color: 'black',
                            fontSize: calculateFontSizePercentage(3),
                            marginVertical: calculateHeightPercentage(0.1),
                        }} numberOfLines={3}>
                            Payment Mode: {item?.partyId?.paymentTerm}
                        </Text>
                        <Text style={{
                            color: 'black',
                            fontSize: calculateFontSizePercentage(3),
                            marginVertical: calculateHeightPercentage(0.1),
                        }} numberOfLines={3}>
                            Total Reciviable: {item?.grandTotal}
                        </Text>
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => toggleProductExpansion(index)}
                        >
                            <Text style={styles.toggleButtonText}>
                                {expandedIndex === index ? 'Hide Products' : 'View Products'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={{
                            color: 'black',
                            fontSize: calculateFontSizePercentage(3),
                            // fontWeight: '700',
                            marginLeft: calculateWidthPercentage(12)
                        }} numberOfLines={3}>
                            Date: {moment(item?.createdAt).format('DD-MM-YYYY')}
                        </Text>

                        <Text style={{
                            color: 'black',
                            marginTop: calculateHeightPercentage(-1.5),
                            fontSize: calculateFontSizePercentage(3),
                            // fontWeight: '700',
                            marginLeft: calculateWidthPercentage(12.5)
                        }} numberOfLines={3}>
                            OrderId: {item?.orderNo?.toUpperCase()}
                        </Text>
                        {item?.challanNo ? (<Text style={{
                            color: 'black',
                            marginTop: calculateHeightPercentage(-1.5),
                            fontSize: calculateFontSizePercentage(3),
                            // fontWeight: '700',
                            marginLeft: calculateWidthPercentage(2)
                        }} numberOfLines={3}>
                            Invoice Id: {item?.challanNo?.toUpperCase()}
                        </Text>) : null}

                        {item?.ARN ? (<Text style={{
                            color: 'black',
                            marginTop: calculateHeightPercentage(-1),
                            fontSize: calculateFontSizePercentage(3),
                            // fontWeight: '700',
                            width: calculateWidthPercentage(36),
                            marginLeft: calculateWidthPercentage(2)
                        }} numberOfLines={3}>
                            ARN: {item?.ARN?.toUpperCase()}
                        </Text>) : null}

                        {/* Buttons */}
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={{ paddingVertical: calculateHeightPercentage(0.5), backgroundColor: 'blue', width: calculateWidthPercentage(18), marginLeft: calculateWidthPercentage(20), borderRadius: calculateFontSizePercentage(1), marginBottom: calculateHeightPercentage(1) }}
                                onPress={() => DeliverProduct(item)}

                            >
                                <Text style={{ fontSize: calculateFontSizePercentage(3.5), color: 'white', textAlign: 'center' }}>
                                    Dispatch
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {expandedIndex === index && (
                        <View style={styles.tableContainer}>
                            <Table borderStyle={{ borderWidth: 1, borderColor: 'black' }}>
                                <Row data={tableHead}
                                    style={{ backgroundColor: 'lightgrey', height: calculateHeightPercentage(4) }}
                                    textStyle={styles.tableText}
                                    widthArr={[calculateWidthPercentage(40), calculateWidthPercentage(25), calculateWidthPercentage(25)]}
                                />
                                {tableData.map((rowData, index) => (
                                    <Row key={index} data={rowData} textStyle={styles.text}
                                        style={{ backgroundColor: 'white' }}
                                        widthArr={[calculateWidthPercentage(40), calculateWidthPercentage(25), calculateWidthPercentage(25)]}
                                    />
                                ))}
                            </Table>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    }, [expandedIndex]);

    return (
        <GestureHandlerRootView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sales Invoice</Text>
                <TouchableOpacity onPress={() => { handleLogout() }}
                    style={{ alignItems: 'center', paddingLeft: calculateWidthPercentage(50) }}
                >

                    <MaterialIcons name={'logout'} size={30} color={'black'} style={styles.backIcon} />
                </TouchableOpacity>
            </View>

            <View style={styles.filters}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Customer..."
                    value={filteredProductData}
                    onChangeText={(text) => handleSearch(text)}
                    autoCapitalize='characters'
                />
            </View>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ) : (
                <FlatList
                    refreshControl={
                        <RefreshControl
                            refreshing={refresh}
                            onRefresh={() => { pullMe() }}
                        />
                    }
                    data={filteredProductData}
                    renderItem={({ item, index }) => (
                        <View style={styles.column}>
                            {renderProductItem(item, index)}
                        </View>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{
                        paddingHorizontal: calculateWidthPercentage(4),
                        paddingTop: calculateHeightPercentage(-2),
                        paddingBottom: calculateHeightPercentage(10),
                    }}
                />
            )}
            <Modal
                animationType='none'
                transparent={true}
                visible={isDeliverModalVisible}
                onRequestClose={() => setDeliverModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: calculateHeightPercentage(-2), marginBottom: calculateHeightPercentage(1) }}>
                            <Text style={{ color: 'black', fontSize: calculateFontSizePercentage(4) }}>Deliver Order</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setDeliverModalVisible(false)
                                }}
                                style={styles.modalCloseButton}
                            >
                                <Icon name='close' size={20} color={'gray'} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: 'black' }}>Package Quantity</Text>
                        <View style={[styles.modalinput, { borderColor: OTPError2 ? 'red' : 'gray' }]}>
                            <TextInput
                                style={{ padding: calculateFontSizePercentage(3) }}
                                placeholder="enter your no. of package"
                                value={OTP2}
                                onChangeText={text => setOTP2(text)}
                                keyboardType='numeric'
                                onFocus={() => setOTPError2('')}
                            />
                        </View>
                        {OTPError2 ? <Text style={styles.errorText}>{OTPError2}</Text> : null}

                        <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: OTPError2 ? calculateHeightPercentage(5) : calculateHeightPercentage(4) }}>
                            <TouchableOpacity
                                onPress={handleDeliver}
                                style={{ height: calculateHeightPercentage(5), width: calculateWidthPercentage(30), backgroundColor: 'blue', borderRadius: calculateFontSizePercentage(1), marginTop: calculateHeightPercentage(-3.2), }}
                            >
                                <Text style={{ textAlign: 'center', paddingVertical: calculateHeightPercentage(1.2), color: 'white' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Add other customer details here */}
                    </View>
                </View>
            </Modal>
            <View style={styles.footer}>
                <Footer navigation={navigation} />
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexWrap: 'wrap',
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: calculateHeightPercentage(8),
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: calculateWidthPercentage(5),
        borderBottomWidth: calculateWidthPercentage(0.06),
        elevation: 3
    },
    backIcon: {
        paddingRight: calculateWidthPercentage(5),
    },
    headerTitle: {
        fontSize: calculateFontSizePercentage(5.5),
        color: 'black',
    },
    card: {
        width: calculateWidthPercentage(93),
        padding: calculateFontSizePercentage(0.01),
        backgroundColor: '#484A59',
    },
    content: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        backgroundColor: '#f5f8fa',
        borderWidth: calculateHeightPercentage(0.1),
        borderColor: 'black',
        paddingVertical: calculateHeightPercentage(0.5),
        paddingHorizontal: calculateWidthPercentage(1),
        borderRadius: calculateFontSizePercentage(1.5)
    },
    footer: {
        position: 'absolute',
        height: "10%",
        alignItems: "center",
        top: calculateHeightPercentage(88)
    },
    // Search
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginTop: calculateHeightPercentage(2),
        marginBottom: calculateHeightPercentage(1),
        width: '100%',
        alignSelf: 'center'
    },
    filters: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: calculateWidthPercentage(3.5),
        paddingVertical: calculateHeightPercentage(0.5),
    },
    // table
    tableContainer: {
        borderRadius: calculateFontSizePercentage(2),
        overflow: 'hidden',
    },
    head: {
        height: calculateHeightPercentage(4),
        backgroundColor: '#f1f8ff',
    },
    column: {
        marginBottom: calculateHeightPercentage(2),
    },
    text: {
        padding: calculateFontSizePercentage(1),
        fontSize: calculateFontSizePercentage(2.5),
        textAlign: 'center',
        color: 'black',
    },
    tableText: {
        fontSize: calculateFontSizePercentage(3),
        textAlign: 'center',
        color: 'black',
    },
    title: {
        color: 'black',
        fontSize: calculateFontSizePercentage(3),
        fontWeight: '700',
        width: calculateWidthPercentage(50),
    },
    quantity: {
        color: 'black',
        fontSize: calculateFontSizePercentage(3),
        marginTop: calculateHeightPercentage(0.1),
        width: calculateWidthPercentage(50)
    },
    priceContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginLeft: calculateWidthPercentage(1),
    },
    price: {
        marginTop: calculateHeightPercentage(0.1),
        marginBottom: calculateHeightPercentage(-2),
        fontSize: calculateFontSizePercentage(4),
        color: '#EAA132',
        fontWeight: 'bold',
    },
    toggleButton: {
        paddingVertical: calculateHeightPercentage(0.5),
    },
    toggleButtonText: {
        fontSize: calculateFontSizePercentage(3.5),
        color: 'blue',
    },
    // modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: calculateWidthPercentage(10),
    },
    modalContent: {
        paddingHorizontal: calculateWidthPercentage(5),
        height: calculateHeightPercentage(28),
        backgroundColor: 'white',
        opacity: 1,
        padding: calculateFontSizePercentage(10),
        borderRadius: 10,
        elevation: 5,
    },
    modalinput: {
        height: calculateHeightPercentage(6),
        width: calculateWidthPercentage(70),
        borderWidth: calculateWidthPercentage(0.2),
        marginBottom: calculateHeightPercentage(3),
        marginTop: calculateHeightPercentage(1),
        borderRadius: calculateFontSizePercentage(1),
    },
    modalCloseButton: {
        marginTop: calculateHeightPercentage(-4),
        borderRadius: 5,
        alignSelf: 'flex-end',
    },
    errorText: {
        color: 'red',
        marginTop: calculateHeightPercentage(-2.5),
        marginBottom: calculateHeightPercentage(0),
        alignSelf: 'flex-start',
        paddingHorizontal: calculateWidthPercentage(1),
    },
    footer: {
        position: 'absolute',
        height: "10%",
        alignItems: "center",
        top: calculateHeightPercentage(88)
    },
});

export default Sales_Invoice_List;