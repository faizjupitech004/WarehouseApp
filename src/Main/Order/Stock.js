import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    FlatList,
    RefreshControl
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, Row } from 'react-native-table-component';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomerBaseUrl } from '../../../Config/BaseUtil';
import Footer from './footer';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const calculateHeightPercentage = (percentage) => (windowHeight * percentage) / 100;
const calculateWidthPercentage = (percentage) => (windowWidth * percentage) / 100;
const calculateFontSizePercentage = (percentage) => {
    const baseDimension = Math.min(windowWidth, windowHeight);
    return (baseDimension * percentage) / 100;
};

const Stock = ({ navigation }) => {
    const [productData, setProductData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredProductData, setFilteredProductData] = useState([]);
    const [refresh, setRefresh] = useState(false);


    const fetchProductData = useCallback(async () => {
        setIsLoading(true);
        try {
            const FullLoginData = await AsyncStorage.getItem('LoginData');
            const LoginData = JSON.parse(FullLoginData);

            const response = await axios.get(`${CustomerBaseUrl}warehouse/view-warehouse-by-id/${LoginData?._id}`);
            const data = response?.data?.Warehouse?.productItems || [];
            setProductData(data);
            setFilteredProductData(data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const pullMe = () => {
        setRefresh(true);
        setTimeout(() => {
            fetchProductData();
            setRefresh(false);
        }, 800)
    }

    useEffect(() => {
        fetchProductData();
    }, [fetchProductData]);

    const handleSearch = useCallback((text) => {
        const keywords = text.trim().toUpperCase().split(/\s+/);
        const filtered = productData.filter(item => {
            const title = item?.productId?.Product_Title?.toUpperCase();
            return keywords.every(keyword => title.includes(keyword));
        });
        setFilteredProductData(filtered);
    }, [productData]);

    const renderRow = ({ item, index }) => (
        <Row
            key={index}
            data={[
                item?.productId?.Product_Title.toUpperCase(),
                item?.productId?.MIN_stockalert,
                item?.productId?.Opening_Stock,
                item?.productId?.Product_MRP.toFixed(2),
            ]}
            borderStyle={{ borderWidth: 1, borderColor: "#C1C0B9" }}
            style={[styles.row, index % 2 && { backgroundColor: "#F7F6E7" }]}
            textStyle={styles.text}
            widthArr={rowWidthArr}
        />
    );

    const rowWidthArr = [
        calculateWidthPercentage(30),
        calculateWidthPercentage(23),
        calculateWidthPercentage(23),
        calculateWidthPercentage(23)
    ];

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
                        onRefresh={() => { pullMe() }}
                    />
                }
                    ListHeaderComponent={() => (
                        <Table borderStyle={{ borderWidth: 1, borderColor: "#C1C0B9" }}>
                            <Row
                                data={["Product Name", "Min. Stock", "Avl. Stock", "Price"]}
                                style={{
                                    height: calculateHeightPercentage(6),
                                    backgroundColor: "#537791",
                                }}
                                widthArr={rowWidthArr}
                                textStyle={styles.headerText}
                            />
                        </Table>
                    )}
                    data={filteredProductData}
                    renderItem={renderRow}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.tableContainer}
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
    footer: {
        position: 'absolute',
        height: calculateHeightPercentage(10),
        alignItems: 'center',
        bottom: 0,
        width: '100%',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginTop: calculateHeightPercentage(2),
        marginBottom: calculateHeightPercentage(1),
        width: '100%',
    },
    filters: {
        paddingHorizontal: calculateWidthPercentage(3.5),
        paddingVertical: calculateHeightPercentage(0.5),
    },
    tableContainer: {
        padding:calculateFontSizePercentage(0.5),
        paddingBottom: calculateHeightPercentage(11),
    },
    headerText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "#fff",
    },
    row: {
        backgroundColor: "#E7E6E1"
    },
    text: {
        paddingVertical: calculateHeightPercentage(0.5),
        textAlign: "center",
    },
});

export default Stock;
