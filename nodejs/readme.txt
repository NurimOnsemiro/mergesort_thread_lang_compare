[특이사항]
* Node.js는 멀티스레드를 지원하지만 스레드 간 메모리 공유를 미지원하므로 메시징 기법을 통해 데이터를 다른 스레드에게 복사하여 전송할 수 밖에 없다. 이에 따라 데이터를 전송 및 수신하는 시간이 상당히 오래 소요되어 멀티스레드를 사용한다 하더라도 성능이 크게 향상되지 않는다.
* 단, 각 스레드에서의 주어진 데이터에 대한 합병정렬 시간은 향상된다.
* 따라서, 실제 합병정렬을 수행하는 부분만 시간을 측정할 수 있어야 한다.
* pkg로 생성하면 스레드가 작동하지 않는다.