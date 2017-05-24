import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

export default class Deck extends Component {
	// will assign some default funcs if user doesn's pass them to this component, we'll use these default once
	static defaultProps = {
		onSwipeRight: () => {},
		onSwipeleft: () => {}
	}
	constructor(props) {
		super(props);

		const position = new Animated.ValueXY();

		const panResponder = PanResponder.create({
			// called when user presses on the screen
			// if returns true, we want to respond to user pressing on the screen
			// if returns false, we don't want to respond to user pressing on the screen
			onStartShouldSetPanResponder: () => true,
			// called when user begins to drag finger on screen
			// called many many times as user is dragging finger on screen
			// gesture argument has info about how a user is moving their finger
			onPanResponderMove: (event, gesture) => {
				position.setValue({ x: gesture.dx, y: gesture.dy })
			},
			// called when user presses down and lets go
			onPanResponderRelease: (event, gesture) => {
				if (gesture.dx > SWIPE_THRESHOLD) {
					this.forceSwipe('right');
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					this.forceSwipe('left');
				} else {
					this.resetPosition();
				}
			}
		});

		this.state = { panResponder, position, index: 0 };
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.setState({ index: 0 });
		}
	}
	componentWillUpdate() {
		// the following code is only need for android
		UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
		// any time a component will re-render, animate the change in cards
		LayoutAnimation.spring();
	}
	// will move card off the screen
	forceSwipe(direction) {
		const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
		Animated.timing(this.state.position, {
			toValue: { x, y: 0 },
			duration: SWIPE_OUT_DURATION // ms
		}).start(() => this.onSwipeComplete(direction));
	}
	// will reset cards
	onSwipeComplete(direction) {
		const { onSwipeleft, onSwipeRight, data } = this.props;
		const item = data[this.state.index];
		direction === 'right' ? onSwipeRight(item) : onSwipeleft(item);
		this.state.position.setValue({ x: 0, y: 0 });
		this.setState({ index: this.state.index + 1 });
	}
	resetPosition() {
		Animated.spring(this.state.position, {
			toValue: { x: 0, y: 0 }
		}).start();
	}
	getCardStyle() {
		const { position } = this.state;
		const rotate = position.x.interpolate({ // will tie horizontal value with output of how much the card should be rotated
			inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
			outputRange: ['-120deg', '0deg', '120deg']
		})
		return {
			...position.getLayout(), // returns an object, so we spread all those properties
			transform: [{ rotate }]
		};
	}
	renderCards() {
		// if no more cards to swipe show noMoreCards component
		if (this.state.index >= this.props.data.length) return this.props.renderNoMoreCards();
		return this.props.data.map((item, i) => {
			// we don't want to render cards that have been swiped off
			if (i < this.state.index) return null;
			// rendering the top card
			if (i === this.state.index) {
				return <Animated.View key={item.id} { ...this.state.panResponder.panHandlers } style={[this.getCardStyle(), styles.cardStyle]}>
					{this.props.renderCard(item)}
				</Animated.View>;
			}
			// for all other cards simply render cards
			// all other cards will be pushed down slightly for a cooler effect
			// rendering Animated.View instead of View
			// because Animated.View doesnt refetch an image every time,
			// getting rid of the anoying image flash
			return <Animated.View key={item.id} style={[styles.cardStyle, { top: 10 * (i - this.state.index) }]}>{this.props.renderCard(item)}</Animated.View>
		}).reverse();
	}
	render() {
		return <View>{this.renderCards()}</View>;
	}
}

const styles = {
	cardStyle: {
		position: 'absolute',
		width: SCREEN_WIDTH
	}
}