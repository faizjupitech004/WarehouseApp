import React, { component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from './src/Auth/splash';
import LoginScreen from './src/Auth/login';
import History from './src/Main/More/History';
import Footer from './src/Main/Order/footer';
import Return_Invoice from './src/Main/More/Return Invoice';
import Stock from './src/Main/Order/Stock';
import Sales_Invoice_List from './src/Main/Order/SalesInvoice';
import Purchase_List from './src/Main/Order/Purchase';
import More from './src/Main/Order/More';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Splash"
          component={Splash}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Sales Invoice"
          options={{ headerShown: false }}
          component={Sales_Invoice_List}
        />
        <Stack.Screen
          name="Return Invoice"
          component={Return_Invoice}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="Purchase"
          component={Purchase_List}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Stock"
          component={Stock}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="History"
          component={History}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="More"
          component={More}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Footer"
          component={Footer}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default App;
