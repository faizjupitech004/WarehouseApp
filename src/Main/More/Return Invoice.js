import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, TextInput, FlatList, RefreshControl } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomerBaseUrl } from '../../../Config/BaseUtil';
import Footer from '../Order/footer';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const calculateHeightPercentage = (percentage) => (windowHeight * percentage) / 100;
const calculateWidthPercentage = (percentage) => (windowWidth * percentage) / 100;
const calculateFontSizePercentage = (percentage) => {
    const baseDimension = Math.min(windowWidth, windowHeight);
    return (baseDimension * percentage) / 100;
};

const rowWidthArr = [
    calculateWidthPercentage(32),
    calculateWidthPercentage(15),
    calculateWidthPercentage(16),
    calculateWidthPercentage(18),
    calculateWidthPercentage(20),
];

const Return_Invoice = ({ navigation }) => {
    const [productData, setProductData] = useState([]);
    const [filteredProductData, setFilteredProductData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const fetchProductData = useCallback(async () => {
        setIsLoading(true);
        try {
            const FullLoginData = await AsyncStorage.getItem('LoginData');
            const LoginData = JSON.parse(FullLoginData);

            if (LoginData?._id) {
                const response = await axios.get(`${CustomerBaseUrl}good-dispatch/view-cancel-order-warehouse/${LoginData._id}`);
                const orders = response?.data?.Order || [];
                const data = orders.flatMap(order => order?.orderItems?.map(item => ({ ...item, orderId: order._id })) || []);
                setProductData(data);
                setFilteredProductData(data);
            }
        } catch (err) {
            console.error(err?.response?.data);
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchProductData();
    }, [fetchProductData]);

    const pullToRefresh = () => {
        setRefresh(true);
        fetchProductData().finally(() => setRefresh(false));
    };

    const handleSearch = useCallback((text) => {
        const keywords = text.trim().toUpperCase().split(/\s+/);
        const filtered = productData.filter(item => {
            const title = item?.productId?.Product_Title?.toUpperCase() || '';
            return keywords.every(keyword => title.includes(keyword));
        });
        setFilteredProductData(filtered);
    }, [productData]);

    const handleReturn = async (product, orderId) => {
        console.log("Product:", product);
        console.log("Order ID:", orderId);
        await axios.get(`${CustomerBaseUrl}good-dispatch/cancel-warehouse-order/${orderId}/${product?._id}`)
        .then((response) => {
            console.log(response?.data?.message);
            fetchProductData();
        })
        .catch((err)=>{
            console.log(err?.response?.data);
        })
    }

    const renderRow = ({ item, index }) => (
        <Row
            key={index}
            data={[
                item?.productId?.Product_Title?.toUpperCase() || '',
                item?.qty || '',
                item?.productId?.Opening_Stock || '',
                item?.productId?.Product_MRP?.toFixed(2) || '',
                <TouchableOpacity
                    style={{
                        padding: calculateFontSizePercentage(1),
                        backgroundColor: 'green',
                        borderRadius: calculateFontSizePercentage(1),
                        width: calculateWidthPercentage(14),
                        alignSelf: 'center'
                    }}
                    onPress={() => { handleReturn(item?.productId, item.orderId) }}
                >
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700' }}>Get</Text>
                </TouchableOpacity>
            ]}
            borderStyle={{ borderWidth: 1, borderColor: "#C1C0B9" }}
            style={[styles.row, index % 2 && styles.rowAlternate]}
            textStyle={styles.text}
            widthArr={rowWidthArr}
        />
    );

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.filters}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Product..."
                    onChangeText={handleSearch}
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
                            onRefresh={pullToRefresh}
                        />
                    }
                    ListHeaderComponent={() => (
                        <Table borderStyle={{ borderWidth: 1, borderColor: "#C1C0B9" }}>
                            <Row
                                data={["Product Name", "Qty", "Stock", "Price", "Return"]}
                                style={styles.header}
                                widthArr={rowWidthArr}
                                textStyle={styles.headerText}
                            />
                        </Table>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No products available</Text>}
                    data={filteredProductData}
                    renderItem={renderRow}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.tableContainer}
                />
            )}

            {/* <View style={styles.footer}>
                <Footer navigation={navigation} />
            </View> */}
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
    filters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: calculateWidthPercentage(3.5),
        paddingVertical: calculateHeightPercentage(0.5),
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
    header: {
        height: calculateHeightPercentage(6),
        backgroundColor: "#537791",
    },
    headerText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "#fff",
    },
    tableContainer: {
        borderRadius: calculateFontSizePercentage(2),
        overflow: 'hidden',
        flexWrap: 'nowrap',
        borderRightColor: calculateFontSizePercentage(1)
    },
    row: {
        backgroundColor: "#E7E6E1",
    },
    rowAlternate: {
        backgroundColor: "#F7F6E7",
    },
    text: {
        paddingVertical: calculateHeightPercentage(0.5),
        paddingHorizontal: calculateHeightPercentage(0.5),
        textAlign: "center",
        color: 'gray'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: 'gray',
    },
    footer: {
        position: 'absolute',
        height: "10%",
        alignItems: "center",
        bottom: 0,
        width: '100%',
    },
});

export default Return_Invoice;
