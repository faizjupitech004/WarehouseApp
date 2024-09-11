import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList, RefreshControl } from 'react-native';
import { Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Table, Row } from 'react-native-table-component';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomerBaseUrl } from '../../../Config/BaseUtil';
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

export const Purchase_List = ({ navigation }) => {
    const [productData, setProductData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredProductData, setFilteredProductData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [refresh, setRefresh] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [loginId, setLoginId] = useState(null);
    const [itemStates, setItemStates] = useState({});

    const GetProduct = useCallback(async () => {
        try {
            const fullLoginData = await AsyncStorage.getItem('LoginData');
            const loginData = JSON.parse(fullLoginData);
            setLoginId(loginData?._id);

            setIsLoading(true);
            const response = await axios.get(`${CustomerBaseUrl}purchase-order/view-purchase-order-history/${loginData?._id}/${loginData?.database}`);
            const data = response?.data?.orderHistory
                ?.filter(ele =>
                    ele.status === "pending" &&
                    ele.orderItems?.some(item =>
                        item.productId?.warehouse === loginData?._id,
                    )
                ) || [];

            setProductData(data);
            setFilteredProductData(data);

            // Reset item states
            setItemStates({});
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    }, [setProductData, setFilteredProductData, setIsLoading]);


    useEffect(() => {
        GetProduct();
    }, [GetProduct]);

    const toggleProductExpansion = (index) => {
        setExpandedIndex(prevIndex => prevIndex === index ? null : index);
    };

    const handleQtyChange = (index, text, item, mainIndex) => {
        const newQty = Number(text);
        let updatedData = [...filteredProductData];
        updatedData[mainIndex].orderItems[index].receivedQty = newQty;
        setFilteredProductData(updatedData);
        setItemStates(prevStates => ({
            ...prevStates,
            [item.orderId]: {
                ...prevStates[item.orderId],
                [`item_${index}`]: {
                    ...prevStates[item.orderId]?.[`item_${index}`],
                    receivedQty: newQty
                }
            }
        }));
    };

    const handleDamageQtyChange = (index, text, item, mainIndex) => {
        const newDamageQty = Number(text);
        let updatedData = [...filteredProductData];
        updatedData[mainIndex].orderItems[index].damageQty = newDamageQty;
        setFilteredProductData(updatedData);
        setItemStates(prevStates => ({
            ...prevStates,
            [item.orderId]: {
                ...prevStates[item.orderId],
                [`item_${index}`]: {
                    ...prevStates[item.orderId]?.[`item_${index}`],
                    damageQty: newDamageQty
                }
            }
        }));
    };

    const DeliverProduct = async (item) => {
        const itemState = itemStates[item.orderId] || {};
        const noOfPackage = itemState.noOfPackage || 0;

        if (!noOfPackage || noOfPackage <= 0) {
            Alert.alert("Error!!!", "Please enter a valid number of packages");
            return;
        }

        // Validate quantities
        const invalidQtyItems = item.orderItems.filter(ele => {
            const receivedQty = ele.receivedQty || 0;
            const damageQty = ele.damageQty || 0;
            const totalQty = ele.qty || 0;

            return (receivedQty > totalQty || damageQty > totalQty) ||
                receivedQty < 0 ||
                damageQty < 0 ||
                receivedQty === undefined ||
                damageQty === undefined;
        });

        if (invalidQtyItems.length > 0) {
            Alert.alert("Error!!!", "Received quantity and damage quantity cannot exceed the total quantity of the product. Please correct the quantities.");
            return;
        }

        const data = item.orderItems
            .filter(ele => ele.productId.warehouse === loginId)
            .map(ele => ({
                productId: ele?.productId?._id,
                ReceiveQty: ele.receivedQty,
                DamageQty: ele.damageQty
            }));

        const payload = {
            DispatchItem: data,
            NoOfPackage: noOfPackage,
        };
        console.log("payload ;- ", payload);

        try {
            const response = await axios.post(`${CustomerBaseUrl}purchase-order/dipatch-purchase-order/${item?._id}`, payload);
            Alert.alert("Success!!!", response?.data?.message);

            // Reset item states
            setItemStates(prevStates => ({
                ...prevStates,
                [item.orderId]: {
                    receivedQty: 0,
                    noOfPackage: 0,
                    damage: 0
                }
            }));

            await GetProduct();  // Ensure the state is refreshed with the updated data

            // Reset the received quantity in the local state
            setFilteredProductData(prevData =>
                prevData.map(order =>
                    order.orderId === item.orderId
                        ? { ...order, orderItems: order.orderItems.map(orderItem => ({ ...orderItem, receivedQty: 0 })) }
                        : order
                )
            );
        } catch (err) {
            console.log(err?.response?.data);
        }
    };

    const handleSearch = useCallback((text) => {
        const keywords = text.trim().toUpperCase().split(/\s+/);
        const matchesSearch = (product, keywords) => {
            const title = product.partyId?.CompanyName.toUpperCase();
            return keywords.every(keyword => title.includes(keyword));
        };

        const filtered = productData.filter(item => {
            return matchesSearch(item, keywords) &&
                (selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase());
        });

        setFilteredProductData(filtered);
    }, [productData, selectedCategory]);

    const pullMe = () => {
        setRefresh(true);
        setTimeout(() => {
            GetProduct();
            setRefresh(false);
        }, 1000);
    };

    const renderProductItem = useCallback((item, index) => {
        const tableHead = ['Product Name', 'Quantity', 'Receive Qty', 'Damage Qty'];
        const tableData = item?.orderItems?.map((ele, ind) => ele?.productId.warehouse === loginId && [
            ele?.productId?.Product_Title?.toUpperCase() || 'N/A',
            ele?.qty || 'N/A',
            <TextInput
                key={`receive_${ind}`}
                style={{ textAlign: 'center' }}
                placeholder='0'
                name="receivedQty"
                value={ele?.receivedQty?.toString() || ""}
                onChangeText={(text) => handleQtyChange(ind, text, item, index)}
                keyboardType='numeric'
            />,
            <TextInput
                key={`damage_${ind}`}
                style={{ textAlign: 'center' }}
                placeholder='0'
                name="damageQty"
                value={itemStates[item.orderId]?.[`item_${ind}`]?.damageQty?.toString() || ""}
                onChangeText={(text) => handleDamageQtyChange(ind, text, item, index)}
                keyboardType='numeric'
            />

        ]) || [];

        return (
            <Card key={item.orderId} style={styles.card}>
                <Card.Content style={styles.content}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.title} numberOfLines={3}>
                            {item?.partyId?.CompanyName?.toUpperCase()}
                        </Text>
                        <Text style={styles.quantity} numberOfLines={3}>
                            Transporter: Faiz Shiekh
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
                            Total Quantity: 10
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

                    <View style={{
                        flexDirection: 'column',
                        marginLeft: calculateWidthPercentage(1),
                    }}>
                        <Text style={{
                            color: 'black',
                            fontSize: calculateFontSizePercentage(3),
                            marginLeft: calculateWidthPercentage(12)
                        }} numberOfLines={3}>
                            Date: {moment(item?.createdAt).format('DD-MM-YYYY')}
                        </Text>

                        <Text style={{
                            color: 'black',
                            marginTop: calculateHeightPercentage(1),
                            fontSize: calculateFontSizePercentage(3),
                            marginLeft: calculateWidthPercentage(12.5)
                        }} numberOfLines={1}>
                            {item.orderNo}
                        </Text>
                    </View>

                    {expandedIndex === index && (
                        <View style={styles.tableContainer}>
                            <Table borderStyle={{ borderWidth: 1, borderColor: 'black' }}>
                                <Row data={tableHead}
                                    style={{ backgroundColor: 'lightgrey', height: calculateHeightPercentage(4) }}
                                    textStyle={styles.tableText}
                                    widthArr={[calculateWidthPercentage(30), calculateWidthPercentage(18), calculateWidthPercentage(20), calculateWidthPercentage(22)]}
                                />
                                {tableData?.map((rowData, index) => (
                                    <Row key={index} data={rowData} textStyle={styles.text}
                                        style={{ backgroundColor: 'white' }}
                                        widthArr={[calculateWidthPercentage(30), calculateWidthPercentage(18), calculateWidthPercentage(20), calculateWidthPercentage(22)]}
                                    />
                                ))}
                            </Table>
                            {/* Input Fields */}
                            <View style={{ flexDirection: 'row', paddingHorizontal: calculateWidthPercentage(2) }}>
                                <View>
                                    <Text style={{ color: 'black', marginTop: calculateHeightPercentage(1), marginLeft: calculateWidthPercentage(1) }}>Number of package</Text>
                                    <TextInput
                                        style={styles.Input}
                                        placeholder="Enter number of package..."
                                        value={itemStates[item.orderId]?.noOfPackage?.toString() || ""}
                                        onChangeText={(text) => setItemStates(prevStates => ({
                                            ...prevStates,
                                            [item.orderId]: {
                                                ...prevStates[item.orderId],
                                                noOfPackage: Number(text)
                                            }
                                        }))}
                                        keyboardType='numeric'
                                    />
                                </View>
                            </View>

                            {/* Buttons */}
                            <View style={{ paddingTop: calculateHeightPercentage(1) }}>
                                <TouchableOpacity
                                    style={{ paddingVertical: calculateHeightPercentage(1), backgroundColor: 'blue', width: calculateWidthPercentage(90), borderRadius: calculateFontSizePercentage(2), marginBottom: calculateHeightPercentage(1) }}
                                    onPress={() => DeliverProduct(item)}
                                >
                                    <Text style={{ fontSize: calculateFontSizePercentage(3.5), color: 'white', textAlign: 'center' }}>
                                        Dispatch
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    }, [expandedIndex, itemStates]);


    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.filters}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Customer..."
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
                            onRefresh={() => pullMe()}
                        />
                    }
                    data={filteredProductData}
                    renderItem={({ item, index }) => (
                        <View style={{ paddingVertical: calculateHeightPercentage(1) }}>
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

            <View style={styles.footer}>
                <Footer navigation={navigation} />
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    Input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginBottom: calculateHeightPercentage(1),
        width: calculateWidthPercentage(85)
    },
    filters: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: calculateWidthPercentage(3.5),
        paddingVertical: calculateHeightPercentage(0.5),
    },
    tableContainer: {
        borderRadius: calculateFontSizePercentage(2),
        overflow: 'hidden',
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
    toggleButton: {
        paddingVertical: calculateHeightPercentage(0.5),
    },
    toggleButtonText: {
        fontSize: calculateFontSizePercentage(3.5),
        color: 'blue',
    },
});

export default Purchase_List;
