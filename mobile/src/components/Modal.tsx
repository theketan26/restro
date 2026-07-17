import React from 'react';
import { Modal as RNModal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

export function Modal({ visible, onRequestClose, children }: { visible: boolean; onRequestClose?: () => void; children: React.ReactNode }) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        <View style={styles.dim} />
        <TouchableWithoutFeedback onPress={onRequestClose}>
          <View style={styles.touchFill} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>{children}</View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  touchFill: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 10,
  },
});

export default Modal;
