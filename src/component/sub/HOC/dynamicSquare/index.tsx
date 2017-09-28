import * as React from "react";
import {
    getDisplayName,
    getImageStyles
} from "../util";
import {
    ContraDirectionType,
    NormalEnemyProps
} from "../../../../common/constant";
import {
    isHitWall,
    isBeyondBottom,
    isHit
} from "../../../../common/util";
import "./index.scss";

interface WrappedDynamicSquareUtils {
    changeBackground: (parm: DynamicSquareOption) => void;
    startBirthAnimate: () => void;
}

export interface DynamicSquareOption {
    imageName?: string;
    position?: string;
}

export interface DynamicSquareProps {
    hoc: WrappedDynamicSquareUtils;
}

interface HocSquareState {
    className: "dynamicHocWrap" | "dynamicHocWrap birthAnimate";
    options: DynamicSquareOption;
    status: ContraDirectionType;
}

interface ComponentDecorator<TOwnProps> {
    (component: React.ComponentClass<DynamicSquareProps & TOwnProps>): React.ComponentClass<TOwnProps>;
}

function WithDynamicSquare<TOwnProps extends Partial<NormalEnemyProps>>(options: DynamicSquareOption): ComponentDecorator<TOwnProps> {
    return Component =>
        class HocSquare extends React.PureComponent<TOwnProps, HocSquareState> {
            constructor(props) {
                super(props);
                this.changeBackground = this.changeBackground.bind(this);
                this.startBirthAnimate = this.startBirthAnimate.bind(this);
            }
            static displayName: string = `Hoc${getDisplayName(Component)}`;
            state: HocSquareState = {
                className: "dynamicHocWrap",
                options,
                status: 0
            };
            moveInterval: any;

            componentDidMount() {
                this.autoMove();
            }
            componentWillUnmount() {
                this.destroy();
            }
            componentWillUpdate(nextProps) {
                this.isHitContra(nextProps);
            }
            isHitContra(nextProps: TOwnProps) {
                const { dynamicData, contraInfo, updateContraLifeStatus } = nextProps;
                const contraPosition = contraInfo.position;
                const { position, type } = dynamicData;
                const m = {
                    left: contraPosition.left,
                    top: contraPosition.top,
                    width: 32,
                    height: 32
                };
                const n = {
                    left: position.left,
                    top: position.top,
                    width: 32,
                    height: 32
                };
                const hasHit: boolean = isHit(m, n);
                if ( hasHit && type === 1 ) {
                    updateContraLifeStatus(1);
                    this.destroy();
                }
                return hasHit;
            }
            autoMove() {
                const _self = this;
                setTimeout(() => {
                    _self.initStatus();
                }, 1000);
            }
            setLeftGradient(step: number): void {
                const { updatePosition, index, dynamicData } = this.props;
                const { position } = dynamicData;
                const currentPosition = Object.assign({}, position, {left: position.left + step});
                updatePosition(currentPosition, index);
            }
            setTopGradient(step: number): void {
                const { updatePosition, index, dynamicData } = this.props;
                const { position } = dynamicData;
                const currentPosition = Object.assign({}, position, {top: position.top + step});
                updatePosition(currentPosition, index);
            }
            toRight(): void {
                const _self = this;
                this.clearMoveInterval();
                this.moveInterval = setInterval(() => {
                    const { dynamicData } = _self.props;
                    const { position } = dynamicData;
                    const { left, top } = position;
                    if (_self.isHitBottomWall(left, top) && !isHitWall(left + 32, top)) {
                        _self.setLeftGradient(2);
                    }
                    else if (isHitWall(left + 32, top)) {
                        _self.setStatus(2);
                    }
                    else {
                        _self.setStatus(4);
                    }
                }, 30);
            }
            toLeft(): void {
                const _self = this;
                const { inGameGBLeft } = this.props;
                this.clearMoveInterval();
                this.moveInterval = setInterval(() => {
                    const { dynamicData } = _self.props;
                    const { position } = dynamicData;
                    const { left, top } = position;
                    if ( left < inGameGBLeft) {
                        _self.destroy();
                    }
                    else if (_self.isHitBottomWall(left, top) && !isHitWall(left, top)) {
                        _self.setLeftGradient(-2);
                    }
                    else if (isHitWall(left, top)) {
                        _self.setStatus(1);
                    }
                    else {
                        _self.setStatus(4);
                    }
                }, 30);
            }
            toBottom(): void {
                const _self = this;
                this.clearMoveInterval();
                this.moveInterval = setInterval(() => {
                    const { dynamicData } = _self.props;
                    const { position } = dynamicData;
                    const { top } = position;
                    if ( isBeyondBottom(top + 32) ) {
                        _self.destroy();
                    }
                    else if ( !_self.isHitBottomWall() ) {
                        _self.setTopGradient(4);
                    }
                    else {
                        _self.initStatus();
                    }
                }, 30);
            }
            isHitBottomWall(x: number = 0, y: number = 0): boolean {
                const { dynamicData } = this.props;
                const { position } = dynamicData;
                const { left, top } = position;
                const currentX = x ? x : left;
                const currentY = y ? y : top;
                return isHitWall(currentX, currentY + 32) || isHitWall(currentX + 32, currentY + 32);
            }
            initStatus() {
                const { dynamicData } = this.props;
                const { toward } = dynamicData;
                const status = toward === 1 ? 1 : 2;
                this.setStatus(status);
            }
            setOptions(parm: DynamicSquareOption) {
                this.setState({ options: parm });
            }
            setStatus(parm: ContraDirectionType) {
                this.setState({ status: parm }, this.statusListening);
            }
            statusListening(): void {
                const { status } = this.state;
                switch (status) {
                    case 0:
                        this.clearMoveInterval();
                        break;
                    case 1:
                        this.toRight();
                        break;
                    case 2:
                        this.toLeft();
                        break;
                    case 4:
                        this.toBottom();
                        break;
                }
            }
            destroy() {
                const { deleteDynamicSquare, index } = this.props;
                this.clearMoveInterval();
                deleteDynamicSquare(index);
                console.log("one enemy destroy...");
            }
            clearMoveInterval(): void {
                if (this.moveInterval) {
                    clearInterval(this.moveInterval);
                    this.moveInterval = 0;
                }
            }
            changeBackground(parm: DynamicSquareOption): void {
                this.setOptions(parm);
            }
            startBirthAnimate() {
                this.setState({
                    className: "dynamicHocWrap birthAnimate"
                });
            }
            render() {
                const passThroughProps: any = this.props;
                const { dynamicData } = passThroughProps;
                const { left, top } = dynamicData.position;
                const { options, className } = this.state;
                const staticProps: WrappedDynamicSquareUtils = {
                    changeBackground: this.changeBackground,
                    startBirthAnimate: this.startBirthAnimate
                };
                const imageStyles = getImageStyles(options);
                const styles = {...imageStyles, left, top};

                return (
                    <div
                        className={className}
                        style={styles}>
                        <Component
                            hoc={staticProps}
                            {...passThroughProps} />
                    </div>
                );
            }
        };
}

export default WithDynamicSquare;