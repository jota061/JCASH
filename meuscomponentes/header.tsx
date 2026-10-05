import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";

const alturaStatusBar = StatusBar.currentHeight ? StatusBar.currentHeight : (Platform.OS === "ios" ? 44 : 20);

export function Header() {
    return (
        <View style={styles.header}>
            <Text style={styles.logo}>JCASH</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 70 + alturaStatusBar,
        paddingTop: alturaStatusBar,
        width: "100%",
        backgroundColor: "#1A2026",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        zIndex: 10,
        elevation: 8,
    },
    logo: {
        fontSize: 24,
        color: "#00E676",
        fontWeight: "700",
        letterSpacing: 2,
    },
});
